package com.productkit.jobs

import ai.fal.client.kt.subscribe
import com.productkit.models.ImageData
import com.productkit.models.Product
import com.productkit.models.ProductStatus
import com.productkit.repositories.ProductRepository
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
    private val fal = FalService()
    private val nvidia = NvidiaService()

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
                val product = productRepo.findById(productId) ?: run {
                    println("[JOB_PROCESSING] Product $productId not found")
                    status.status = "ERROR"; return@launch
                }

                var imageData: ImageData? = null
                if ("hero" in req.assetTypes || "lifestyle" in req.assetTypes || "detail" in req.assetTypes) {
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
                if ("360" in req.assetTypes) {
                    println("[JOB_PROCESSING] Generating 3D model for product $productId")
                    val baseImage = product.originalImages.firstOrNull()
                    if (baseImage != null) {
                        val modelUrl = nvidia.generate3DModel(baseImage)
                       assets3d = modelUrl
                    }
                    status.progress = 70
                }

                // Generate marketing copy using Fal AI
                println("[JOB_PROCESSING] Generating marketing copy for product $productId")
                var productCopy: com.productkit.models.ProductCopy? = null
                try {
                    val copyPrompt = """
                        You are an expert marketing copywriter. Create compelling product marketing copy for the following product.
                        
                        Product Name: ${product.name}
                        Product Description: ${product.description ?: "No description provided"}
                        
                        Generate a JSON object with the following fields:
                        - headline: A catchy, attention-grabbing headline (max 60 characters)
                        - subheadline: A compelling subheadline that expands on the headline (max 120 characters)
                        - description: A detailed product description (2-3 sentences, max 300 characters)
                        - features: An array of 3-5 key product features (each max 50 characters)
                        - benefits: An array of 3-5 customer benefits (each max 50 characters)
                        
                        Return ONLY the JSON object, no extra text.
                    """.trimIndent()

                    val result = fal.fal.subscribe(
                        endpointId = "fal-ai/llama-3-70b-instruct",
                        input = mapOf(
                            "prompt" to copyPrompt,
                            "max_tokens" to 1024,
                            "temperature" to 0.7
                        ),
                        options = ai.fal.client.kt.SubscribeOptions(logs = true)
                    ) { update ->
                        println("[JOB_PROCESSING] Marketing copy generation: $update")
                    }

                    var jsonString = result.data.toString()
                        .replace("```json", "")
                        .replace("```", "")
                        .trim()

                    // Try to extract just the JSON object if there's extra text
                    val jsonMatch = Regex("""\{[\s\S]*?\}""").find(jsonString)
                    if (jsonMatch != null) {
                        jsonString = jsonMatch.value
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

                    println("[JOB_PROCESSING] Generated marketing copy: ${productCopy.headline}")
                } catch (e: Exception) {
                    println("[JOB_PROCESSING] Failed to generate marketing copy: ${e.message}")
                    e.printStackTrace()
                    // Use fallback copy
                    productCopy = com.productkit.models.ProductCopy(
                        headline = product.name,
                        subheadline = "Discover the perfect ${product.name}",
                        description = product.description ?: "A premium product designed for you.",
                        features = listOf("High Quality", "Durable", "Stylish"),
                        benefits = listOf("Long-lasting", "Great Value", "Customer Favorite")
                    )
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

                // Update product with generated assets and completed status
                val updated: Product = product.copy(
                    status = ProductStatus.COMPLETED,
                    generatedAssets = generatedAssets,
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
