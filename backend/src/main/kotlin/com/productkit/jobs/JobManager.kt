package com.productkit.jobs

import ai.fal.client.kt.subscribe
import com.productkit.models.ImageData
import com.productkit.models.Product
import com.productkit.models.ProductStatus
import com.productkit.repositories.ProductRepository
import com.productkit.services.AnthropicService
import com.productkit.services.FalService

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.async
import kotlinx.serialization.json.decodeFromJsonElement
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

data class GenerationRequest(
    val assetTypes: List<String>,
    val count: Map<String, Int>,
    val style: String? = null
)

@kotlinx.serialization.Serializable
data class JobStep(
    val id: String,
    val name: String,
    var status: String = "PENDING", // PENDING, RUNNING, COMPLETED, ERROR, SKIPPED
    var startTime: Long? = null,
    var endTime: Long? = null,
    var durationMs: Long? = null
)

data class GenerationJobStatus(
    val jobId: String,
    val productId: String,
    var status: String,
    var progress: Int,
    var steps: MutableList<JobStep> = mutableListOf(),
    var generatedAssets: ImageData? = null,
    var generated3dAssets: String? = null
)

object JobManager {
    private val scope = CoroutineScope(Dispatchers.Default)
    private val jobs = ConcurrentHashMap<String, GenerationJobStatus>()
    private val tasks = ConcurrentHashMap<String, Job>()

    private val productRepo = ProductRepository()
    private val userRepo = com.productkit.repositories.UserRepository()
    private val settingsRepo = com.productkit.repositories.SettingsRepository()
    private val fal = FalService()
    private val anthropic = AnthropicService()
    private val storage = com.productkit.services.StorageService()
    private val shopify = com.productkit.services.ShopifyService()
    private val nvidia = com.productkit.services.NvidiaService()

    fun getStatus(jobId: String): GenerationJobStatus? = jobs[jobId]

    fun getStatusByProductId(productId: String): GenerationJobStatus? {
        return jobs.values.find { it.productId == productId }
    }

    private fun updateStep(status: GenerationJobStatus, stepId: String, stepStatus: String) {
        synchronized(status) {
            val step = status.steps.find { it.id == stepId }
            if (step != null) {
                step.status = stepStatus
                if (stepStatus == "RUNNING") {
                    step.startTime = System.currentTimeMillis()
                } else if (stepStatus == "COMPLETED" || stepStatus == "ERROR") {
                    step.endTime = System.currentTimeMillis()
                    if (step.startTime != null) {
                        step.durationMs = step.endTime!! - step.startTime!!
                    }
                }
            }
        }
    }

    fun enqueueAssetsGeneration(productId: String, req: GenerationRequest): String {
        val jobId = UUID.randomUUID().toString()

        // Define initial steps
        val steps = mutableListOf(
            JobStep("init", "Initializing", "PENDING"),
            JobStep("images", "Generating Images", "PENDING"),
            JobStep("model", "Generating 3D Model", "PENDING"),
            JobStep("copy", "Writing Marketing Copy", "PENDING"),
            JobStep("shopify", "Syncing to Shopify", "PENDING"),
            JobStep("video", "Generating Video", "PENDING"),
            JobStep("infographic", "Generating Infographic", "PENDING")
        )

        val status = GenerationJobStatus(jobId, productId, status = "QUEUED", progress = 0, steps = steps)
        jobs[jobId] = status

        val job = scope.launch {
            try {
                println("[JOB_PROCESSING] Starting job $jobId for product $productId")
                status.status = "RUNNING"
                status.progress = 5
                updateStep(status, "init", "RUNNING")
                delay(500)
                updateStep(status, "init", "COMPLETED")

                var product = productRepo.findById(productId) ?: run {
                    println("[JOB_PROCESSING] Product $productId not found")
                    status.status = "ERROR"; return@launch
                }

                // Update to GENERATING_IMAGES status (as a general "generating assets" status)
                product = product.copy(status = ProductStatus.GENERATING_IMAGES, updatedAt = System.currentTimeMillis())
                productRepo.update(product)

                // Launch parallel tasks
                val imageDeferred = async {
                    if ("hero" in req.assetTypes || "lifestyle" in req.assetTypes || "detail" in req.assetTypes) {
                        println("[JOB_PROCESSING] Generating images for product $productId (types: ${req.assetTypes})")
                        updateStep(status, "images", "RUNNING")
                        val heroCount = req.count["hero"] ?: 5
                        val baseImage = product.originalImages.firstOrNull()
                        if (baseImage != null) {
                            val settings = settingsRepo.get(product.userId)
                            val brandGuidelines = settings?.brandGuidelines
                            val images = fal.generateProductImages(productId, baseImage, type = "hero", count = heroCount, brandGuidelines = brandGuidelines)
                            synchronized(status) { status.progress += 35 }
                            updateStep(status, "images", "COMPLETED")
                            images
                        } else {
                            println("[JOB_PROCESSING] No base image found for product $productId")
                            updateStep(status, "images", "ERROR")
                            null
                        }
                    } else {
                        null
                    }
                }

                val modelDeferred = scope.async {
                    println("[JOB_PROCESSING] Generating 3D model for product $productId")
                    updateStep(status, "model", "RUNNING")
                    val baseImage = product.originalImages.firstOrNull()
                    if (baseImage != null) {
                        try {
                            val modelUrl = fal.generate3DModelGLB(baseImage)
                            println("[JOB_PROCESSING] GLB generated at: $modelUrl")

                            // Download the file
                            val url = java.net.URL(modelUrl)
                            val bytes = url.readBytes()
                            val fileName = "product-$productId-model.glb"

                            // Upload to S3
                            println("[JOB_PROCESSING] Uploading GLB to storage...")
                            val s3Url = storage.uploadFile(fileName, bytes, "model/gltf-binary")
                            println("[JOB_PROCESSING] GLB uploaded to: $s3Url")
                            synchronized(status) { status.progress += 30 }
                            updateStep(status, "model", "COMPLETED")
                            s3Url
                        } catch (e: Exception) {
                            println("[JOB_PROCESSING] Failed to generate/upload 3D model: ${e.message}")
                            e.printStackTrace()
                            updateStep(status, "model", "ERROR")
                            null
                        }
                    } else {
                        null
                    }
                }

                val copyDeferred = async {
                    // Generate marketing copy using Anthropic Claude
                    println("[JOB_PROCESSING] Generating marketing copy for product $productId using Anthropic Claude")
                    updateStep(status, "copy", "RUNNING")
                    var productCopy: com.productkit.models.ProductCopy? = null
                    try {
                        println("[JOB_PROCESSING] Sending prompt to Anthropic for marketing copy generation")
                        
                        // Parse PDF guides if available
                        val pdfContent = StringBuilder()
                        if (product.pdfGuides.isNotEmpty()) {
                            println("[JOB_PROCESSING] Parsing ${product.pdfGuides.size} PDF guides using NVIDIA NIM...")
                            product.pdfGuides.forEachIndexed { index, url ->
                                try {
                                    val text = nvidia.parsePdf(url)
                                    if (text.isNotBlank()) {
                                        pdfContent.append("\n--- PDF GUIDE ${index + 1} ---\n")
                                        pdfContent.append(text)
                                        pdfContent.append("\n")
                                    }
                                } catch (e: Exception) {
                                    println("[JOB_PROCESSING] Failed to parse PDF guide $url: ${e.message}")
                                }
                            }
                        }

                        val response = anthropic.generateMarketingCopy(
                            productName = product.name,
                            productDescription = product.description,
                            pdfGuidesCount = product.pdfGuides.size,
                            pdfContent = pdfContent.toString()
                        )

                        var jsonString = response
                            .replace("```json", "")
                            .replace("```", "")
                            .trim()

                        println("[JOB_PROCESSING] Raw AI response: $jsonString")

                        // Try to extract just the JSON object if there's extra text
                        val jsonMatch = Regex("""\{[\s\S]*?\}""").find(jsonString)
                        if (jsonMatch != null) {
                            jsonString = jsonMatch.value
                            println("[JOB_PROCESSING] Extracted JSON: $jsonString")
                        }

                        val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
                        val copyData = json.decodeFromString<Map<String, kotlinx.serialization.json.JsonElement>>(jsonString)

                        productCopy = com.productkit.models.ProductCopy(
                            headline = copyData["headline"]?.toString()?.trim('"') ?: "",
                            subheadline = copyData["subheadline"]?.toString()?.trim('"') ?: "",
                            description = copyData["description"]?.toString()?.trim('"') ?: "",
                            features = copyData["features"]?.let {
                                kotlinx.serialization.json.Json.decodeFromJsonElement<List<String>>(it)
                            } ?: emptyList(),
                            benefits = copyData["benefits"]?.let {
                                kotlinx.serialization.json.Json.decodeFromJsonElement<List<String>>(it)
                            } ?: emptyList(),
                            usageInstructions = copyData["usageInstructions"]?.let {
                                kotlinx.serialization.json.Json.decodeFromJsonElement<List<String>>(it)
                            } ?: emptyList(),
                            maintenanceInstructions = copyData["maintenanceInstructions"]?.let {
                                kotlinx.serialization.json.Json.decodeFromJsonElement<List<String>>(it)
                            } ?: emptyList()
                        )

                        println("[JOB_PROCESSING] Successfully generated marketing copy:")
                        println("[JOB_PROCESSING]   Headline: ${productCopy.headline}")
                        println("[JOB_PROCESSING]   Features: ${productCopy.features}")
                        println("[JOB_PROCESSING]   Benefits: ${productCopy.benefits}")
                    } catch (e: Exception) {
                        println("[JOB_PROCESSING] Failed to generate marketing copy: ${e.message}")
                        e.printStackTrace()

                        // Generate more contextual fallback copy based on product details
                        val productWords = product.name.split(" ").filter { it.length > 3 }
                        val descWords = product.description?.split(" ")?.filter { it.length > 4 }?.take(3) ?: emptyList()

                        val fallbackFeatures = mutableListOf<String>()
                        val fallbackBenefits = mutableListOf<String>()

                        // Generate contextual features
                        if (productWords.isNotEmpty()) {
                            fallbackFeatures.add("Premium ${productWords.firstOrNull() ?: "Quality"} Design")
                        }
                        fallbackFeatures.addAll(listOf(
                            "Durable Construction",
                            "Modern Aesthetic",
                            "Expert Craftsmanship"
                        ))

                        // Generate contextual benefits
                        fallbackBenefits.addAll(listOf(
                            "Built to Last",
                            "Exceptional Value",
                            "Customer Favorite",
                            "Trusted Quality"
                        ))

                        productCopy = com.productkit.models.ProductCopy(
                            headline = "Discover ${product.name}",
                            subheadline = "Premium quality meets exceptional design",
                            description = product.description ?: "Experience the perfect blend of style, quality, and functionality with ${product.name}.",
                            features = fallbackFeatures.take(4),
                            benefits = fallbackBenefits.take(4),
                            usageInstructions = listOf("Follow included instructions", "Use as intended", "Keep in good condition"),
                            maintenanceInstructions = listOf("Clean regularly", "Store properly", "Handle with care")
                        )

                        println("[JOB_PROCESSING] Using fallback marketing copy:")
                        println("[JOB_PROCESSING]   Features: ${productCopy.features}")
                        println("[JOB_PROCESSING]   Benefits: ${productCopy.benefits}")
                    }
                    synchronized(status) { status.progress += 15 }
                    updateStep(status, "copy", "COMPLETED")
                    productCopy
                }

                // Await image and copy results (not 3D model)
                val imageData = imageDeferred.await()
                val productCopy = copyDeferred.await()

                // Build GeneratedAssets from the generated data (without 3D model for now)
                val existingAssets = product.generatedAssets
                val heroImageUrls = imageData?.images?.map { it.url } ?: emptyList()

                val generatedAssets = com.productkit.models.GeneratedAssets(
                    heroImages = if (heroImageUrls.isNotEmpty()) heroImageUrls else (existingAssets?.heroImages ?: emptyList()),
                    lifestyleImages = existingAssets?.lifestyleImages ?: emptyList(),
                    detailImages = existingAssets?.detailImages ?: emptyList(),
                    product360Views = existingAssets?.product360Views ?: emptyList(),
                    productCopy = productCopy ?: (existingAssets?.productCopy ?: com.productkit.models.ProductCopy("", "", "", emptyList(), emptyList(), emptyList(), emptyList())),
                    technicalSpecs = existingAssets?.technicalSpecs ?: emptyMap(),
                    siteUrl = existingAssets?.siteUrl,
                    arModelUrl = existingAssets?.arModelUrl // Keep existing 3D model if any
                )

                // Sync to Shopify
                var shopifyId: String? = null
                var shopifyUrl: String? = null

                if (generatedAssets != null) {
                     // Update to SYNCING_SHOPIFY status
                     product = product.copy(status = ProductStatus.SYNCING_SHOPIFY, updatedAt = System.currentTimeMillis())
                     productRepo.update(product)

                     val user = userRepo.findById(product.userId)
                     if (user?.shopifyStoreUrl != null && user.shopifyAccessToken != null) {
                         updateStep(status, "shopify", "RUNNING")
                         val shopifyResult = shopify.createProduct(product, generatedAssets, user.shopifyStoreUrl, user.shopifyAccessToken)
                         if (shopifyResult != null) {
                             shopifyId = shopifyResult.id
                             shopifyUrl = shopifyResult.url

                             // Update product with media (images)
                             println("[SHOPIFY] Adding media to product ${shopifyResult.id}...")
                             val productWithId = product.copy(shopifyProductId = shopifyResult.id)
                             val mediaUpdated = shopify.createProductMedia(
                                 productWithId,
                                 generatedAssets,
                                 user.shopifyStoreUrl,
                                 user.shopifyAccessToken
                             )
                             if (mediaUpdated) {
                                 println("[SHOPIFY] Media successfully added to product")
                             } else {
                                 println("[SHOPIFY] Failed to add media to product")
                             }
                          }
                          updateStep(status, "shopify", "COMPLETED")
                      } else {
                          println("[SHOPIFY] User ${product.userId} does not have Shopify credentials configured")
                          updateStep(status, "shopify", "SKIPPED")
                      }
                }

                // Update product with generated assets and completed status
                val updated: Product = product.copy(
                    status = ProductStatus.COMPLETED,
                    generatedAssets = generatedAssets,
                    shopifyProductId = shopifyId,
                    shopifyStorefrontUrl = shopifyUrl,
                    updatedAt = System.currentTimeMillis()
                )
                productRepo.update(updated)

                println("[JOB_PROCESSING] Updated product $productId with ${heroImageUrls.size} hero images and marketing copy")

                status.generatedAssets = imageData
                status.progress = 100
                status.status = "COMPLETED"
                println("[JOB_PROCESSING] Job $jobId completed successfully")

                // Launch async post-completion job for 3D model and video
                scope.launch {
                    try {
                        println("[JOB_PROCESSING] Starting post-completion assets for product $productId")

                        // Update status to POST_COMPLETION_ASSETS
                        var postProduct = productRepo.findById(productId)
                        if (postProduct != null) {
                            postProduct = postProduct.copy(status = ProductStatus.POST_COMPLETION_ASSETS, updatedAt = System.currentTimeMillis())
                            productRepo.update(postProduct)
                        }

                        // Launch video generation in parallel
                        val videoDeferred = async {
                            println("[JOB_PROCESSING] Generating product video for product $productId")
                            updateStep(status, "video", "RUNNING")
                            // Use the first generated hero image as base, or original image if none
                            val baseImage = heroImageUrls.firstOrNull() ?: product.originalImages.firstOrNull()
                            if (baseImage != null) {
                                try {
                                    val videoUrl = fal.generateProductVideo("Cinematic product showcase", baseImage)
                                    println("[JOB_PROCESSING] Video generated at: $videoUrl")
                                    updateStep(status, "video", "COMPLETED")
                                    videoUrl
                                } catch (e: Exception) {
                                    println("[JOB_PROCESSING] Failed to generate video: ${e.message}")
                                    e.printStackTrace()
                                    updateStep(status, "video", "ERROR")
                                    null
                                }
                            } else {
                                updateStep(status, "video", "SKIPPED")
                                null
                            }
                        }

                        // Launch infographic generation in parallel
                        val infographicDeferred = async {
                            println("[JOB_PROCESSING] Generating product infographic for product $productId")
                            updateStep(status, "infographic", "RUNNING")
                            // Use the first generated hero image as base, or original image if none
                            val baseImage = heroImageUrls.firstOrNull() ?: product.originalImages.firstOrNull()
                            val currentProductCopy = productCopy ?: com.productkit.models.ProductCopy(
                                headline = "",
                                subheadline = "",
                                description = "",
                                features = emptyList(),
                                benefits = emptyList(),
                                usageInstructions = emptyList(),
                                maintenanceInstructions = emptyList()
                            )

                            if (baseImage != null) {
                                try {
                                    val infographicUrl = fal.generateProductInfographic(
                                        productName = product.name,
                                        productDescription = product.description,
                                        baseImage = baseImage,
                                        productCopy = currentProductCopy
                                    )
                                    println("[JOB_PROCESSING] Infographic generated at: $infographicUrl")
                                    updateStep(status, "infographic", "COMPLETED")
                                    infographicUrl
                                } catch (e: Exception) {
                                    println("[JOB_PROCESSING] Failed to generate infographic: ${e.message}")
                                    e.printStackTrace()
                                    updateStep(status, "infographic", "ERROR")
                                    null
                                }
                            } else {
                                updateStep(status, "infographic", "SKIPPED")
                                null
                            }
                        }

                        // Await 3D model, video, and infographic generation
                        val assets3d = modelDeferred.await()
                        val videoUrl = videoDeferred.await()
                        val infographicUrl = infographicDeferred.await()

                        if (assets3d != null || videoUrl != null || infographicUrl != null) {
                            // Update product with new assets
                            postProduct = productRepo.findById(productId)
                            if (postProduct != null) {
                                val updatedAssets = postProduct.generatedAssets?.copy(
                                    arModelUrl = assets3d ?: postProduct.generatedAssets?.arModelUrl,
                                    videoUrl = videoUrl ?: postProduct.generatedAssets?.videoUrl,
                                    infographicUrl = infographicUrl ?: postProduct.generatedAssets?.infographicUrl
                                )
                                val finalProduct = postProduct.copy(
                                    generatedAssets = updatedAssets,
                                    status = ProductStatus.COMPLETED,
                                    updatedAt = System.currentTimeMillis()
                                )
                                productRepo.update(finalProduct)
                                println("[JOB_PROCESSING] Updated product $productId with post-completion assets (3D: ${assets3d != null}, Video: ${videoUrl != null}, Infographic: ${infographicUrl != null})")
                                status.generated3dAssets = assets3d

                                // Upload new assets to Shopify
                                if (updatedAssets != null) {
                                    val user = userRepo.findById(postProduct.userId)
                                    if (user?.shopifyStoreUrl != null && user.shopifyAccessToken != null) {
                                        println("[SHOPIFY] Uploading post-completion assets to Shopify...")
                                    // Create a GeneratedAssets object with ONLY the new assets to avoid duplicating existing ones
                                    val newAssetsOnly = com.productkit.models.GeneratedAssets(
                                        arModelUrl = assets3d,
                                        videoUrl = videoUrl,
                                        infographicUrl = infographicUrl,
                                        productCopy = finalProduct.generatedAssets?.productCopy ?: com.productkit.models.ProductCopy("", "", "", emptyList(), emptyList(), emptyList(), emptyList())
                                    )
                                    
                                    val mediaUpdated = shopify.createProductMedia(
                                        finalProduct,
                                        newAssetsOnly,
                                        user.shopifyStoreUrl,
                                        user.shopifyAccessToken
                                    )
                                        if (mediaUpdated) {
                                            println("[SHOPIFY] Post-completion assets successfully added to product")
                                        } else {
                                            println("[SHOPIFY] Failed to add post-completion assets to product")
                                        }
                                    }
                                }
                            }
                        } else {
                            // Even if assets fail, set status back to COMPLETED
                            postProduct = productRepo.findById(productId)
                            if (postProduct != null && postProduct.status == ProductStatus.POST_COMPLETION_ASSETS) {
                                val finalProduct = postProduct.copy(
                                    status = ProductStatus.COMPLETED,
                                    updatedAt = System.currentTimeMillis()
                                )
                                productRepo.update(finalProduct)
                            }
                        }
                    } catch (e: Exception) {
                        println("[JOB_PROCESSING] Post-completion assets failed for product $productId: ${e.message}")
                        e.printStackTrace()
                        // Ensure product is marked as COMPLETED even if post-completion fails
                        val postProduct = productRepo.findById(productId)
                        if (postProduct != null && postProduct.status == ProductStatus.POST_COMPLETION_ASSETS) {
                            val finalProduct = postProduct.copy(
                                status = ProductStatus.COMPLETED,
                                updatedAt = System.currentTimeMillis()
                            )
                            productRepo.update(finalProduct)
                        }
                    }
                }
            } catch (e: Exception) {
                println("[JOB_PROCESSING] Job $jobId failed: ${e.message}")
                e.printStackTrace()
                status.status = "ERROR"
            }
        }
        tasks[jobId] = job
        return jobId
    }
}
