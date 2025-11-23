package com.productkit.services

import ai.fal.client.ClientConfig
import ai.fal.client.kt.*
import ai.fal.client.queue.QueueStatus
import com.productkit.models.ImageData
import com.productkit.utils.Config
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.json.*

class FalService(
    // Official client will handle FAL_KEY automatically from environment
    val fal: FalClient = createFalClient(
        ClientConfig.withCredentials {
            Config.FAL_API_KEY
        }
    )
) {
    companion object {
        // Seedream v4 edit model endpoint
        private const val IMAGE_EDIT_MODEL = "fal-ai/beta-image-232/edit"
    }

    private val anthropicService = AnthropicService()

    /**
     * Generate product images using the Seedream v4 edit model
     *
     * @param productId Product identifier for tracking
     * @param baseImage URL of the base image to edit
     * @param type Type of product photo (e.g., "lifestyle", "studio", "outdoor")
     * @param count Number of images to generate (will call API multiple times with different prompts)
     * @return ImageData containing all generated image URLs
     */
    suspend fun generateProductImages(
        productId: String,
        baseImage: String,
        type: String,
        count: Int,
        brandGuidelines: com.productkit.models.BrandGuidelines? = null
    ): ImageData {
        // Dynamically generate prompts based on the image content
        // First, understand the image using the bagel/understand model
        println("UNDERSTANDING IMG")
        val understoodDescription = understandImage(baseImage)
        println("[UNDERSTOOD] $understoodDescription")
        // Then, generate marketing prompts using a Llama 3 model
        val generatedPrompts = generatePromptsFromDescription(understoodDescription, brandGuidelines)
        println("[PROMPTS] $generatedPrompts")

        // Ensure we have at least some prompts; fallback to default if needed
        val prompts = if (generatedPrompts.isNotEmpty()) generatedPrompts else listOf(
            "Professional studio product photography with clean white background, perfect lighting, high resolution, commercial quality",
            "Lifestyle product photo in modern minimalist setting, natural lighting, elegant composition, lifestyle magazine style",
            "Close-up product detail shot highlighting texture and quality, macro photography, sharp focus, premium look",
            "Product in outdoor natural environment, beautiful scenery background, golden hour lighting, atmospheric",
            "Product in use demonstration, real-world context, lifestyle photography, authentic setting, professional quality"
        )
        val allImages = mutableListOf<com.productkit.models.Image>()
        var lastSeed: Long = 0

        // Generate images with different prompts in parallel
        coroutineScope {
            val deferredImages = (0 until minOf(count, prompts.size)).map { i ->
                async {
                    try {
                        val prompt = prompts[i]
                        println("[FalService] Generating image ${i + 1}/$count for product $productId with prompt: ${prompt.take(50)}...")

                        // Prepare input for the model
                        val input = mapOf(
                            "prompt" to prompt,
                            "image_urls" to listOf(baseImage),
                            "seed" to (lastSeed + i + 1) // Use different seeds for variety
                        )

                        // Using subscribe for real-time updates
                        val result = fal.subscribe(
                            endpointId = IMAGE_EDIT_MODEL,
                            input = input,
                            options = SubscribeOptions(logs = true)
                        ) { update ->
                            when (update) {
                                is QueueStatus.InProgress -> {
                                    println("[FalService] Processing image ${i + 1}: ${update.logs}")
                                }
                                is QueueStatus.Completed -> {
                                    println("[FalService] Completed image ${i + 1} for product: $productId")
                                }
                                else -> {
                                    // Handle other status types if needed
                                }
                            }
                        }

                        // Extract URLs from the result
                        val imageData = Json.decodeFromString<ImageData>(result.data.toString())
                        println("[FalService] Successfully generated image ${i + 1}/$count")
                        imageData
                    } catch (e: Exception) {
                        println("[FalService] Failed to generate image ${i + 1}: ${e.message}")
                        e.printStackTrace()
                        null
                    }
                }
            }

            // Wait for all images to complete
            val results = deferredImages.awaitAll()

            // Collect successful results
            results.filterNotNull().forEach { imageData ->
                allImages.addAll(imageData.images)
                // Update lastSeed with the seed from the last successful image (approximate)
                lastSeed = imageData.seed
            }
        }

        // Return combined results
        return ImageData(
            images = allImages,
            seed = lastSeed
        )
    }

    /**
     * Generate consistent variations of a product across different contexts
     *
     * @param productId Product identifier for tracking
     * @param embedding Product identity embedding description
     * @param contexts List of context descriptions for variations
     * @return List of generated image URLs
     */
    suspend fun generateConsistentVariations(
        productId: String,
        embedding: String,
        contexts: List<String>
    ): ImageData {
        // Generate variations for each context
        for (ctx in contexts)
        {
            val prompt = "${ctx.trim()}. Maintain product identity: $embedding"

            try
            {
                // Using run for simpler operations (no status updates needed)
                val result = fal.run(
                    endpointId = IMAGE_EDIT_MODEL,
                    input = mapOf("prompt" to prompt),
                    options = RunOptions()
                )

                return Json.decodeFromString<ImageData>(result.data.toString())
            } catch (e: Exception)
            {
                e.printStackTrace()
                println("Error generating variation for context '$ctx': ${e.message}")
                // Continue with other contexts even if one fails
            }
        }

        throw IllegalStateException("no images gened")
    }

    /**
     * Alternative: Use queue-based processing for batch operations
     * This is useful when you want to submit multiple requests and retrieve results later
     */
    suspend fun generateProductImagesBatch(
        requests: List<ProductImageRequest>
    ): Map<String, String> {
        val requestIdMap = mutableMapOf<String, String>()

        // Submit all requests to the queue
        for (request in requests) {
            val input = mapOf(
                "prompt" to request.prompt,
                "image_urls" to listOf(request.baseImage)
            )

            val submission = fal.queue.submit(
                endpointId = IMAGE_EDIT_MODEL,
                input = input,
                options = SubmitOptions(webhookUrl = request.webhookUrl),
                // Optional webhook for async notifications
            )

            requestIdMap[request.productId] = submission.requestId
        }

        return requestIdMap
    }

    /**
     * Generate a 3D GLB model using Fal AI omnipart model.
     * Returns a URL to the generated GLB file.
     */
    suspend fun generate3DModelGLB(baseImage: String): String {
        // Prepare input for omnipart model. The model expects an input image URL.
        val input = mapOf(
            "input_image_url" to baseImage
        )

        // Submit the job to the omnipart endpoint.
        val submission = fal.queue.submit(
            endpointId = "fal-ai/omnipart",
            input = input,
            options = SubmitOptions()
        )

        // Poll for result synchronously (simple implementation).
        var attempts = 0
        while (attempts < 300) { // wait up to ~100 seconds
            runCatching {
                val status = fal.queue.status(
                    endpointId = "fal-ai/omnipart",
                    requestId = submission.requestId
                )

                if (status.status != QueueStatus.Status.COMPLETED)
                {
                    attempts++
                    kotlinx.coroutines.delay(1000L)
                    return@runCatching
                }

                val result = fal.queue.result(
                    endpointId = "fal-ai/omnipart",
                    requestId = submission.requestId
                )

                println("INP: ${result.data}")
                return result.data.get("full_model_mesh").asJsonObject.get("url").asString
            }.onFailure {
                it.printStackTrace()
            }
        }
        throw IllegalStateException("Failed to retrieve GLB model from Fal AI after waiting")
    }

    /**
     * Generate a product showcase video using Fal AI veo2 model.
     * Returns a URL to the generated video file.
     */
    suspend fun generateProductVideo(prompt: String, imageUrl: String): String {
        val input = mapOf(
            "prompt" to prompt,
            "image_url" to imageUrl
        )

        println("[FalService] Generating video with prompt: $prompt")

        val result = fal.subscribe(
            endpointId = "fal-ai/veo2/image-to-video",
            input = input,
            options = SubscribeOptions(
                logs = true
            )
        ) { update ->
            if (update is QueueStatus.InProgress) {
                println("[FalService] Video generation progress: ${update.logs.lastOrNull()?.message ?: "Processing..."}")
            }
        }

        val videoUrl = result.data.asJsonObject.get("video").asJsonObject.get("url").asString
        println("[FalService] Video generated successfully: $videoUrl")
        return videoUrl
    }

    /**
     * Generate a highly detailed product infographic or manual using the alpha image -> image model.
     * Creates an English readable infographic with product details, features, and specifications.
     * 
     * @param productName Name of the product
     * @param productDescription Description of the product
     * @param baseImage URL of the base product image
     * @param productCopy Marketing copy containing features and benefits
     * @return URL of the generated infographic image
     */
    suspend fun generateProductInfographic(
        productName: String,
        productDescription: String?,
        baseImage: String,
        productCopy: com.productkit.models.ProductCopy
    ): String {
        println("[FalService] Generating product infographic for: $productName")
        
        // Construct a detailed prompt for the infographic
        val featuresText = productCopy.features.joinToString(", ")
        val benefitsText = productCopy.benefits.joinToString(", ")
        
        val prompt = """
            Create a highly detailed, professional product infographic or manual with clear ENGLISH TEXT that is READABLE. 
            The infographic must include readable English text labels, headings, and descriptions.
            
            Product: $productName
            ${if (productDescription != null) "Description: $productDescription" else ""}
            
            The infographic should prominently feature:
            - Product name as the main heading in large, bold, readable English text
            - Key features section with readable bullet points: $featuresText
            - Benefits section with readable text: $benefitsText
            - Professional layout with clear typography
            - Icons and visual elements to illustrate features
            - Clean, modern design with good use of whitespace
            - High contrast text for readability
            - Product specifications in a structured format
            
            Style: Professional infographic design, similar to product manuals or technical specifications sheets.
            All text must be in clear, legible English. Use a clean, modern sans-serif font.
            Layout should be well-organized with distinct sections for features, benefits, and specifications.
            Include visual diagrams or icons where appropriate.
        """.trimIndent()

        println("[FalService] Infographic prompt: ${prompt.take(200)}...")

        try {
            // Prepare input for the model
            val input = mapOf(
                "prompt" to prompt,
                "image_urls" to listOf(baseImage),
                "seed" to System.currentTimeMillis() // Use timestamp for unique results
            )

            // Using subscribe for real-time updates
            val result = fal.subscribe(
                endpointId = IMAGE_EDIT_MODEL,
                input = input,
                options = SubscribeOptions(logs = true)
            ) { update ->
                when (update) {
                    is QueueStatus.InProgress -> {
                        println("[FalService] Infographic generation progress: ${update.logs.lastOrNull()?.message ?: "Processing..."}")
                    }
                    is QueueStatus.Completed -> {
                        println("[FalService] Infographic generation completed")
                    }
                    else -> {
                        // Handle other status types if needed
                    }
                }
            }

            // Extract the first image URL from the result
            val imageData = Json.decodeFromString<ImageData>(result.data.toString())
            val infographicUrl = imageData.images.firstOrNull()?.url
                ?: throw IllegalStateException("No infographic image generated")
            
            println("[FalService] Successfully generated infographic: $infographicUrl")
            return infographicUrl
            
        } catch (e: Exception) {
            println("[FalService] Failed to generate infographic: ${e.message}")
            e.printStackTrace()
            throw e
        }
    }

    /**
     * Retrieve batch results using request IDs
     */
    suspend fun getBatchResults(
        requestIds: Map<String, String>
    ): Map<String, ImageData> {
        val results = mutableMapOf<String, ImageData>()

        for ((productId, requestId) in requestIds) {
            try {
                val result = fal.queue.result(
                    endpointId = IMAGE_EDIT_MODEL,
                    requestId = requestId
                )

                results[productId] = Json.decodeFromString<ImageData>(result.data.toString())
            } catch (e: Exception) {
                println("Error retrieving result for product $productId: ${e.message}")
            }
        }

        return results
    }

    /**
     * Check the status of a queued request
     */
    suspend fun checkRequestStatus(requestId: String): QueueStatus.StatusUpdate {
        return fal.queue.status(
            endpointId = IMAGE_EDIT_MODEL,
            requestId = requestId
        )
    }

    /**
     *
     * Data class for batch processing
     */
    data class ProductImageRequest(
        val productId: String,
        val baseImage: String,
        val prompt: String,
        val webhookUrl: String? = null
    )

    private suspend fun understandImage(imageUrl: String): String {
        println("[FalService] Understanding image using Anthropic: $imageUrl")
        return anthropicService.understandImage(imageUrl)
    }

    private suspend fun generatePromptsFromDescription(description: String, brandGuidelines: com.productkit.models.BrandGuidelines? = null): List<String> {
        println("[FalService] Generating prompts using Anthropic...")
        return anthropicService.generatePromptsFromDescription(description, brandGuidelines)
    }
}
