package com.productkit.services

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.productkit.models.ProductCopy
import com.productkit.utils.Config
import com.productkit.utils.HttpClientProvider
import io.ktor.client.HttpClient
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*

class NvidiaService(
    private val client: HttpClient = HttpClientProvider.client,
    private val apiKey: String? = Config.NVIDIA_API_KEY,
    private val baseUrl: String = "https://api.nvidia.com/productkit"
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    data class ThreeDResponse(@JsonProperty("modelUrl") val modelUrl: String)

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class CopyResponse(
        @JsonProperty("headline") val headline: String,
        @JsonProperty("subheadline") val subheadline: String,
        @JsonProperty("description") val description: String,
        @JsonProperty("features") val features: List<String>,
        @JsonProperty("benefits") val benefits: List<String>
    )

    suspend fun generate3DModel(imageUrl: String): String {
        if (apiKey.isNullOrBlank()) throw IllegalStateException("NVIDIA_API_KEY is not set")
        val resp: ThreeDResponse = client.post("$baseUrl/3d") {
            header(HttpHeaders.Authorization, "Bearer $apiKey")
            contentType(ContentType.Application.Json)
            setBody(mapOf("imageUrl" to imageUrl))
        }.body()
        return resp.modelUrl
    }

    suspend fun generateProductCopy(
        productName: String,
        features: List<String>
    ): ProductCopy {
        if (apiKey.isNullOrBlank()) throw IllegalStateException("NVIDIA_API_KEY is not set")
        val resp: CopyResponse = client.post("$baseUrl/copy") {
            header(HttpHeaders.Authorization, "Bearer $apiKey")
            contentType(ContentType.Application.Json)
            setBody(mapOf("productName" to productName, "features" to features))
        }.body()
        return ProductCopy(
            headline = resp.headline,
            subheadline = resp.subheadline,
            description = resp.description,
            features = resp.features,
            benefits = resp.benefits
        )
    }
}
