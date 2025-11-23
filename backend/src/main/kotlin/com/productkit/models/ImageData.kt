package com.productkit.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ImageData(
    val images: List<Image>,
    val seed: Long,
    val timings: Timings? = null,
    @SerialName("has_nsfw_concepts")
    val hasNsfwConcepts: List<Boolean>? = null,
    val prompt: String? = null
)

@Serializable
data class Image(
    val url: String,
    @SerialName("content_type")
    val contentType: String,
    @SerialName("file_name")
    val fileName: String? = null,  // Made nullable
    @SerialName("file_size")
    val fileSize: Long? = null,     // Made nullable
    val width: Int? = null,
    val height: Int? = null
)

@Serializable
data class Timings(
    val inference: Double
)
