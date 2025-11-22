package com.productkit.services

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.productkit.utils.Config
import com.productkit.utils.HttpClientProvider
import io.ktor.client.HttpClient
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*

class FalService(
    private val client: HttpClient = HttpClientProvider.client,
    private val apiKey: String? = Config.FAL_API_KEY,
    private val baseUrl: String = "https://fal.run/fal-ai/flux/dev"
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class FalImage(
        @JsonProperty("url") val url: String
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class FalResponse(
        @JsonProperty("images") val images: List<FalImage>? = null,
        @JsonProperty("image") val image: FalImage? = null
    )

    suspend fun generateProductImages(
        productId: String,
        baseImage: String,
        type: String,
        count: Int
    ): List<String> {
        if (apiKey.isNullOrBlank()) throw IllegalStateException("FAL_API_KEY is not set")
        val prompt = "High-quality $type product photo. Studio lighting. Ecommerce ready."
        val response: FalResponse = client.post(baseUrl) {
            header(HttpHeaders.Authorization, "Key $apiKey")
            contentType(ContentType.Application.Json)
            setBody(
                mapOf(
                    "prompt" to prompt,
                    "num_images" to count.coerceIn(1, 20),
                    "image_size" to "1024x1024"
                )
            )
        }.body()

        val urls = when {
            response.images != null -> response.images.map { it.url }
            response.image != null -> listOf(response.image.url)
            else -> emptyList()
        }
        return urls
    }

    suspend fun generateConsistentVariations(
        productId: String,
        embedding: String,
        contexts: List<String>
    ): List<String> {
        if (apiKey.isNullOrBlank()) throw IllegalStateException("FAL_API_KEY is not set")
        val results = mutableListOf<String>()
        for (ctx in contexts) {
            val prompt = "${ctx.trim()}. Maintain product identity: $embedding"
            val response: FalResponse = client.post(baseUrl) {
                header(HttpHeaders.Authorization, "Key $apiKey")
                contentType(ContentType.Application.Json)
                setBody(
                    mapOf(
                        "prompt" to prompt,
                        "num_images" to 1,
                        "image_size" to "1024x1024"
                    )
                )
            }.body()
            val url = response.images?.firstOrNull()?.url ?: response.image?.url
            if (url != null) results.add(url)
        }
        return results
    }
}
