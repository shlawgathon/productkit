package com.productkit.models

import org.bson.types.ObjectId
import kotlinx.serialization.Serializable

data class User(
    val _id: String = ObjectId().toString(),
    val email: String,
    val passwordHash: String,
    val shopifyStoreUrl: String? = null,
    val shopifyAccessToken: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val bio: String? = null,
    val profileImage: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

data class Product(
    val _id: String = ObjectId().toString(),
    val userId: String,
    val name: String,
    val description: String? = null,
    val originalImages: List<String> = emptyList(),
    val pdfGuides: List<String> = emptyList(),
    val status: ProductStatus = ProductStatus.DRAFT,
    val generatedAssets: GeneratedAssets? = null,
    val shopifyProductId: String? = null,
    val shopifyStorefrontUrl: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Serializable
enum class ProductStatus {
    DRAFT,
    PROCESSING,
    GENERATING_IMAGES,
    GENERATING_COPY,
    GENERATING_SITE,
    SYNCING_SHOPIFY,
    COMPLETED,
    POST_COMPLETION_ASSETS,
    ERROR
}

data class GeneratedAssets(
    val heroImages: List<String> = emptyList(),
    val lifestyleImages: List<String> = emptyList(),
    val detailImages: List<String> = emptyList(),
    val product360Views: List<String> = emptyList(),
    val productCopy: ProductCopy = ProductCopy("", "", "", emptyList(), emptyList()),
    val technicalSpecs: Map<String, String> = emptyMap(),
    val siteUrl: String? = null,
    val arModelUrl: String? = null,
    val videoUrl: String? = null,
    val infographicUrl: String? = null
)

data class ProductCopy(
    val headline: String,
    val subheadline: String,
    val description: String,
    val features: List<String>,
    val benefits: List<String>
)

data class UserSettings(
    val userId: String,
    val shopifyConfig: ShopifyConfig? = null,
    val apiKeys: ApiKeys? = null,
    val brandGuidelines: BrandGuidelines? = null
)

data class ShopifyConfig(
    val storeUrl: String,
    val accessToken: String,
    val autoSync: Boolean = false
)

data class BrandGuidelines(
    val primaryColor: String,
    val secondaryColor: String,
    val fontFamily: String,
    val tone: String
)

data class ApiKeys(
    val falApiKey: String? = null,
    val nvidiaApiKey: String? = null,
    val doSpacesKey: String? = null,
    val doSpacesSecret: String? = null,
    val vercelToken: String? = null
)
