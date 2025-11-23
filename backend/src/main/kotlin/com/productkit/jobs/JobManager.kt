package com.productkit.jobs

import ai.fal.client.kt.subscribe
import com.productkit.models.ImageData
import com.productkit.models.Product
import com.productkit.models.ProductStatus
import com.productkit.repositories.ProductRepository
import com.productkit.services.AnthropicService
import com.productkit.services.FalService
import com.productkit.services.NvidiaService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.decodeFromJsonElement
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

data class GenerationRequest(
    val assetTypes: List<String>,
    val count: Map<String, Int>,
    val style: String? = null
)

data class GenerationJobStatus(
    val jobId: String,
    val productId: String,
    var status: String,
    var progress: Int,
    var generatedAssets: ImageData? = null,
    var generated3dAssets: String? = null
)

object JobManager {
    private val scope = CoroutineScope(Dispatchers.Default)
    private val jobs = ConcurrentHashMap<String, GenerationJobStatus>()
    private val tasks = ConcurrentHashMap<String, Job>()

    private val productRepo = ProductRepository()
    private val userRepo = com.productkit.repositories.UserRepository()
    private val fal = FalService()
    private val nvidia = NvidiaService()
    private val anthropic = AnthropicService()
    private val storage = com.productkit.services.StorageService()
    private val shopify = com.productkit.services.ShopifyService()

    fun getStatus(jobId: String): GenerationJobStatus? = jobs[jobId]

    fun enqueueAssetsGeneration(productId: String, req: GenerationRequest): String {
        val jobId = UUID.randomUUID().toString()
        val status = GenerationJobStatus(jobId, productId, status = "QUEUED", progress = 0)
        jobs[jobId] = status

        val job = scope.launch {
            try {
                println("[JOB_PROCESSING] Starting job $jobId for product $productId")
                status.status = "RUNNING"
                status.progress = 5

                var product = productRepo.findById(productId) ?: run {
                    println("[JOB_PROCESSING] Product $productId not found")
                    status.status = "ERROR"; return@launch
                }

                // Update to PROCESSING status
                product = product.copy(status = ProductStatus.PROCESSING, updatedAt = System.currentTimeMillis())
                productRepo.update(product)

                var imageData: ImageData? = null
                if ("hero" in req.assetTypes || "lifestyle" in req.assetTypes || "detail" in req.assetTypes) {
                    // Update to GENERATING_IMAGES status
                    product = product.copy(status = ProductStatus.GENERATING_IMAGES, updatedAt = System.currentTimeMillis())
                    productRepo.update(product)

                    println("[JOB_PROCESSING] Generating images for product $productId (types: ${req.assetTypes})")
                    val heroCount = req.count["hero"] ?: 5
                    val baseImage = product.originalImages.firstOrNull()
                    if (baseImage != null) {
                        val images = fal.generateProductImages(productId, baseImage, type = "hero", count = heroCount)
                        imageData = images
                    } else {
                        println("[JOB_PROCESSING] No base image found for product $productId")
                    }
                    status.progress = 40
                }

                var assets3d: String? = null
                println("[JOB_PROCESSING] Generating 3D model for product $productId")
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
                        assets3d = s3Url
                        println("[JOB_PROCESSING] GLB uploaded to: $assets3d")
                    } catch (e: Exception) {
                        println("[JOB_PROCESSING] Failed to generate/upload 3D model: ${e.message}")
                        e.printStackTrace()
                    }
                }
                status.progress = 70

                // Update to GENERATING_COPY status
                product = product.copy(status = ProductStatus.GENERATING_COPY, updatedAt = System.currentTimeMillis())
                productRepo.update(product)

                // Generate marketing copy using Anthropic Claude
                println("[JOB_PROCESSING] Generating marketing copy for product $productId using Anthropic Claude")
                var productCopy: com.productkit.models.ProductCopy? = null
                try {
                    println("[JOB_PROCESSING] Sending prompt to Anthropic for marketing copy generation")
                    val response = anthropic.generateMarketingCopy(
                        productName = product.name,
                        productDescription = product.description,
                        pdfGuidesCount = product.pdfGuides.size
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
                        benefits = fallbackBenefits.take(4)
                    )

                    println("[JOB_PROCESSING] Using fallback marketing copy:")
                    println("[JOB_PROCESSING]   Features: ${productCopy.features}")
                    println("[JOB_PROCESSING]   Benefits: ${productCopy.benefits}")
                }
                status.progress = 85

                // Build GeneratedAssets from the generated data
                val existingAssets = product.generatedAssets
                val heroImageUrls = imageData?.images?.map { it.url } ?: emptyList()

                val generatedAssets = com.productkit.models.GeneratedAssets(
                    heroImages = if (heroImageUrls.isNotEmpty()) heroImageUrls else (existingAssets?.heroImages ?: emptyList()),
                    lifestyleImages = existingAssets?.lifestyleImages ?: emptyList(),
                    detailImages = existingAssets?.detailImages ?: emptyList(),
                    product360Views = existingAssets?.product360Views ?: emptyList(),
                    productCopy = productCopy ?: (existingAssets?.productCopy ?: com.productkit.models.ProductCopy("", "", "", emptyList(), emptyList())),
                    technicalSpecs = existingAssets?.technicalSpecs ?: emptyMap(),
                    siteUrl = existingAssets?.siteUrl,
                    arModelUrl = assets3d ?: existingAssets?.arModelUrl
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
                         val shopifyResult = shopify.createProduct(product, generatedAssets, user.shopifyStoreUrl, user.shopifyAccessToken)
                         if (shopifyResult != null) {
                             shopifyId = shopifyResult.id
                             shopifyUrl = shopifyResult.url
                             
                             // Update product with media (images)
                             println("[SHOPIFY] Adding media to product ${shopifyResult.id}...")
                             val mediaUpdated = shopify.updateProductMedia(
                                 shopifyResult.id, 
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
                     } else {
                         println("[SHOPIFY] User ${product.userId} does not have Shopify credentials configured")
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

                println("[JOB_PROCESSING] Updated product $productId with ${heroImageUrls.size} hero images, 3D model: ${assets3d != null}, and marketing copy")

                status.generatedAssets = imageData
                status.generated3dAssets = assets3d
                status.progress = 100
                status.status = "COMPLETED"
                println("[JOB_PROCESSING] Job $jobId completed successfully")
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
