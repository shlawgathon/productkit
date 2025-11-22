package com.productkit.services

import com.channelape.shopify.sdk.ShopifySdk
import com.channelape.shopify.sdk.model.ProductRequest
import com.channelape.shopify.sdk.model.Product as ShopifyProduct
import com.channelape.shopify.sdk.model.ProductImage
import com.productkit.models.GeneratedAssets
import com.productkit.models.Product

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
            val shopifyProduct = ShopifyProduct()
            shopifyProduct.title = product.name
            
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
            shopifyProduct.bodyHtml = descriptionHtml
            shopifyProduct.productType = "Generated Product"
            shopifyProduct.vendor = "ProductKit"
            
            // Add images
            val images = assets.heroImages.map { url ->
                val image = ProductImage()
                image.src = url
                image
            }
            shopifyProduct.images = images

            // Create request
            val request = ProductRequest()
            request.product = shopifyProduct

            val createdProduct = shopifySdk.createProduct(request)
            
            val shopUrl = "https://${shopDomain}.myshopify.com/products/${createdProduct.handle}"
            
            println("[SHOPIFY] Product created successfully: ${createdProduct.id} ($shopUrl)")
            
            return ShopifyProductResult(
                id = createdProduct.id.toString(),
                handle = createdProduct.handle,
                url = shopUrl
            )
        } catch (e: Exception) {
            println("[SHOPIFY] Failed to create Shopify product: ${e.message}")
            e.printStackTrace()
            return null
        }
    }
}
