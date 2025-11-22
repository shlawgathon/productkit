package com.productkit.services

import com.productkit.models.GeneratedAssets
import com.productkit.models.Product
import com.shopify.ShopifySdk
import com.shopify.model.Image
import com.shopify.model.ShopifyProduct
import com.shopify.model.ShopifyProductCreationRequest

class ShopifyService {

    data class ShopifyProductResult(
        val id: String,
        val handle: String,
        val url: String
    )

    fun createProduct(product: Product, assets: GeneratedAssets, shopDomain: String, accessToken: String): ShopifyProductResult? {
        if (shopDomain.isBlank() || accessToken.isBlank()) {
            println("[SHOPIFY] Missing credentials, skipping product creation")
            return null
        }

        val shopifySdk = try {
            ShopifySdk.newBuilder()
                .withSubdomain(shopDomain)
                .withAccessToken(accessToken)
                .build()
        } catch (e: Exception) {
            println("[SHOPIFY] Failed to initialize SDK: ${e.message}")
            return null
        }

        try {
            println("[SHOPIFY] Creating product '${product.name}' on Shopify ($shopDomain)...")

            // Construct HTML description from copy
            val descriptionHtml = buildString {
                append("<p>${assets.productCopy.description}</p>")

                if (assets.productCopy.features.isNotEmpty()) {
                    append("<h3>Features</h3><ul>")
                    assets.productCopy.features.forEach { feature ->
                        append("<li>$feature</li>")
                    }
                    append("</ul>")
                }

                if (assets.productCopy.benefits.isNotEmpty()) {
                    append("<h3>Benefits</h3><ul>")
                    assets.productCopy.benefits.forEach { benefit ->
                        append("<li>$benefit</li>")
                    }
                    append("</ul>")
                }
            }

            val createdProduct = shopifySdk.createProduct(
                ShopifyProductCreationRequest.newBuilder()
                    .withTitle(product.name)
                    .withMetafieldsGlobalTitleTag(product.name).withProductType("Generated Product").withBodyHtml(descriptionHtml)
                    .withMetafieldsGlobalDescriptionTag(product.description)
                    .withVendor("ProductKit")
                    .withTags(setOf("productkit"))
                    .withSortedOptionNames(listOf())
                    .withImageSources(assets.heroImages)
                    .withVariantCreationRequests(listOf())
                    .withPublished(true)
                    .build()
            )

            val shopUrl = "https://${shopDomain}.myshopify.com/products/${createdProduct.id}"

            println("[SHOPIFY] Product created successfully: ${createdProduct.id} ($shopUrl)")

            return ShopifyProductResult(
                id = createdProduct.id.toString(),
                handle = createdProduct.id,
                url = shopUrl
            )
        } catch (e: Exception) {
            println("[SHOPIFY] Failed to create Shopify product: ${e.message}")
            e.printStackTrace()
            return null
        }
    }
}
