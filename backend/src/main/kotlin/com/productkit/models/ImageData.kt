package com.productkit.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ImageData(
    val images: List<Image>,
    val seed: Long
)

@Serializable
data class Image(
    val url: String,
    @SerialName("content_type")
    val contentType: String,
    @SerialName("file_name")
    val fileName: String,
    @SerialName("file_size")
    val fileSize: Long,
    val width: Int? = null,
    val height: Int? = null
)
