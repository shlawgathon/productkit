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
        private const val SEEDREAM_EDIT_MODEL = "fal-ai/bytedance/seedream/v4/edit"

        // You can also use other models like:
        // private const val FLUX_MODEL = "fal-ai/flux/dev"
        // private const val SDXL_MODEL = "fal-ai/fast-sdxl"
    }

    /**
     * Generate product images using the Seedream v4 edit model
     *
     * @param productId Product identifier for tracking
     * @param baseImage URL of the base image to edit
     * @param type Type of product photo (e.g., "lifestyle", "studio", "outdoor")
     * @param count Number of images to generate (not directly supported by seedream edit, will generate 1)
     * @return List of generated image URLs
     */
    suspend fun generateProductImages(
        productId: String,
        baseImage: String,
        type: String,
        count: Int
    ): ImageData {
        val prompt = "High-quality $type product photo. Studio lighting. Ecommerce ready."

        // Prepare input for the model
        val input = mapOf(
            "prompt" to prompt,
            "image_urls" to listOf(baseImage)
            // Note: Seedream v4 edit doesn't support num_images parameter
            // If you need multiple variations, you'll need to call multiple times
        )

        // Using subscribe for real-time updates (recommended for longer operations)
        val result = fal.subscribe(
            endpointId = SEEDREAM_EDIT_MODEL,
            input = input,
            options = SubscribeOptions(logs = true)
        ) { update ->
            // Handle status updates if needed
            when (update) {
                is QueueStatus.InProgress -> {
                    // You can log progress here if needed
                    println("Processing: ${update.logs}")
                }
                is QueueStatus.Completed -> {

                    println("Completed processing for product: $productId ${
                        update.logs
                    }")
                }
                else -> {
                    // Handle other status types if needed
                }
            }
        }

        // Extract URLs from the result
        // The response structure may vary based on the model
        return Json.decodeFromString<ImageData>(result.data.toString())
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
                    endpointId = SEEDREAM_EDIT_MODEL,
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
                endpointId = SEEDREAM_EDIT_MODEL,
                input = input,
                options = SubmitOptions(webhookUrl = request.webhookUrl),
                 // Optional webhook for async notifications
            )

            requestIdMap[request.productId] = submission.requestId
        }

        return requestIdMap
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
                    endpointId = SEEDREAM_EDIT_MODEL,
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
            endpointId = SEEDREAM_EDIT_MODEL,
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
