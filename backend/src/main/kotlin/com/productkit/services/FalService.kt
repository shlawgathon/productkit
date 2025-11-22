package com.productkit.services

import ai.fal.client.ClientConfig
import ai.fal.client.kt.*
import ai.fal.client.queue.QueueStatus
import com.productkit.models.ImageData
import com.productkit.utils.Config
import kotlinx.serialization.json.Json

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
        private const val IMAGE_UNDERSTAND_MODEL = "fal-ai/bagel/understand"
        private const val TEXT_LLM = "fal-ai/llama-3-70b-instruct"
    }


    // Helper to understand image content using bagel/understand model
    private suspend fun understandImage(imageUrl: String): String {
        val input = mapOf(
            "image_url" to imageUrl,
            "prompt" to "What is shown in the image?"
        )
        val result = fal.run(
            endpointId = IMAGE_UNDERSTAND_MODEL,
            input = input,
            options = RunOptions()
        )
        val jsonStr = result.data.toString()
        val regex = Regex("\\\"text\\\":\\\"([^\\\"]+)\\\"")
        val match = regex.find(jsonStr)
        return match?.groupValues?.get(1) ?: ""
    }

    // Helper to generate marketing prompts from description using Llama 3 model
    private suspend fun generatePromptsFromDescription(description: String): List<String> {
        if (description.isBlank()) return emptyList()
        val prompt = "Based on the following description, generate five concise marketing copy prompts for product images. Return each prompt on a separate line.\nDescription: $description"
        val result = fal.run(
            endpointId = TEXT_LLM,
            input = mapOf("prompt" to prompt),
            options = RunOptions()
        )
        val text = result.data.toString()
        val regex = Regex("\\\"text\\\":\\\"([^\\\"]+)\\\"")
        val match = regex.find(text)
        val generated = match?.groupValues?.get(1) ?: ""
        return generated.split("\n").map { it.trim() }.filter { it.isNotEmpty() }
    }

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
        count: Int
    ): ImageData {
        // Dynamically generate prompts based on the image content
        // First, understand the image using the bagel/understand model
        val understoodDescription = understandImage(baseImage)
        // Then, generate marketing prompts using a Llama 3 model
        val generatedPrompts = generatePromptsFromDescription(understoodDescription)
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

        // Generate images with different prompts
        for (i in 0 until minOf(count, prompts.size)) {
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
                allImages.addAll(imageData.images)
                lastSeed = imageData.seed

                println("[FalService] Successfully generated image ${i + 1}/$count")
            } catch (e: Exception) {
                println("[FalService] Failed to generate image ${i + 1}: ${e.message}")
                e.printStackTrace()
                // Continue with other images even if one fails
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
        while (attempts < 100) { // wait up to ~30 seconds
            try {
                val result = fal.queue.result(
                    endpointId = "fal-ai/omnipart",
                    requestId = submission.requestId
                )
                // Assuming result.data contains a field "url" with the GLB location.
                val jsonStr = result.data.toString()
                // Simple extraction of URL using regex.
                val regex = Regex("\\\"url\\\":\\\"([^\\\"]+)\\\"")
                val match = regex.find(jsonStr)
                if (match != null) {
                    return match.groupValues[1]
                }
            } catch (e: Exception) {
                // If not ready yet, ignore and retry.
            }
            attempts++
            kotlinx.coroutines.delay(1000L)
        }
        throw IllegalStateException("Failed to retrieve GLB model from Fal AI after waiting")
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
}
