package com.productkit.services

import com.productkit.models.GeneratedAssets
import com.productkit.models.Product
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

class ShopifyService {
    private val client = HttpClient(CIO)
    private val json = Json {
        ignoreUnknownKeys = true
        prettyPrint = true
    }

    data class ShopifyProductResult(
        val id: String,
        val handle: String,
        val url: String
    )

    @Serializable
    data class GraphQLRequest(
        val query: String,
        val variables: JsonObject? = null
    )

    private suspend fun getOnlineStorePublicationId(shopDomain: String, accessToken: String): String? {
        val query = """
            query {
              publications(first: 20) {
                nodes {
                  id
                  name
                }
              }
            }
        """.trimIndent()

        val apiUrl = "https://${shopDomain}/admin/api/2025-10/graphql.json"

        return try {
            val response: HttpResponse = client.post(apiUrl) {
                contentType(ContentType.Application.Json)
                header("X-Shopify-Access-Token", accessToken)
                setBody(json.encodeToString(GraphQLRequest.serializer(), GraphQLRequest(query)))
            }

            val responseBody = response.bodyAsText()
            val responseJson = json.parseToJsonElement(responseBody).jsonObject
            val data = responseJson["data"]?.jsonObject
            val publications = data?.get("publications")?.jsonObject?.get("nodes")?.jsonArray

            publications?.map { it.jsonObject }
                ?.find { it["name"]?.jsonPrimitive?.content == "Online Store" }
                ?.get("id")?.jsonPrimitive?.content
        } catch (e: Exception) {
            println("[SHOPIFY] Failed to fetch publications: ${e.message}")
            null
        }
    }

    suspend fun createProduct(product: Product, assets: GeneratedAssets, shopDomain: String, accessToken: String): ShopifyProductResult? {
        if (shopDomain.isBlank() || accessToken.isBlank()) {
            println("[SHOPIFY] Missing credentials, skipping product creation")
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
                        append("<li>${feature.replace("\"", "&quot;")}</li>")
                    }
                    append("</ul>")
                }

                if (assets.productCopy.benefits.isNotEmpty()) {
                    append("<h3>Benefits</h3><ul>")
                    assets.productCopy.benefits.forEach { benefit ->
                        append("<li>${benefit.replace("\"", "&quot;")}</li>")
                    }
                    append("</ul>")
                }
            }

            // Build GraphQL mutation for product creation and publish to Online Store
            val mutation = """
                mutation {
                  productCreate(product: {
                    title: "${product.name.replace("\"", "\\\"")}",
                    descriptionHtml: "${descriptionHtml.replace("\"", "\\\"").replace("\n", "\\n")}",
                    productType: "Generated Product",
                    vendor: "ProductKit",
                    status: ACTIVE,
                    tags: ["productkit"]
                  }) {
                    product {
                      id
                      title
                      handle
                      onlineStoreUrl
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }
            """.trimIndent()

            val apiUrl = "https://${shopDomain}/admin/api/2025-10/graphql.json"

            val response: HttpResponse = client.post(apiUrl) {
                contentType(ContentType.Application.Json)
                header("X-Shopify-Access-Token", accessToken)
                setBody(json.encodeToString(GraphQLRequest.serializer(), GraphQLRequest(mutation)))
            }

            val responseBody = response.bodyAsText()
            println("[SHOPIFY] Response: $responseBody")

            val responseJson = json.parseToJsonElement(responseBody).jsonObject
            val data = responseJson["data"]?.jsonObject
            val productCreate = data?.get("productCreate")?.jsonObject
            val userErrors = productCreate?.get("userErrors")?.jsonArray

            if (userErrors != null && userErrors.isNotEmpty()) {
                println("[SHOPIFY] User errors:")
                userErrors.forEach { error ->
                    val errorObj = error.jsonObject
                    println("  - ${errorObj["field"]?.jsonPrimitive?.content}: ${errorObj["message"]?.jsonPrimitive?.content}")
                }
                return null
            }

            val productData = productCreate?.get("product")?.jsonObject
            if (productData == null) {
                println("[SHOPIFY] No product data in response")
                return null
            }

            val productId = productData["id"]?.jsonPrimitive?.content ?: return null
            val handle = productData["handle"]?.jsonPrimitive?.content ?: ""

            // Fetch the Online Store Publication ID
            val publicationId = getOnlineStorePublicationId(shopDomain, accessToken)

            if (publicationId != null) {
                // Now publish the product to the Online Store
                val publishMutation = """
                    mutation {
                      publishablePublish(
                        id: "$productId",
                        input: [{
                          publicationId: "$publicationId"
                        }]
                      ) {
                        publishable {
                          availablePublicationsCount {
                            count
                          }
                        }
                        userErrors {
                          field
                          message
                        }
                      }
                    }
                """.trimIndent()

                val publishResponse: HttpResponse = client.post(apiUrl) {
                    contentType(ContentType.Application.Json)
                    header("X-Shopify-Access-Token", accessToken)
                    setBody(json.encodeToString(GraphQLRequest.serializer(), GraphQLRequest(publishMutation)))
                }

                val publishResponseBody = publishResponse.bodyAsText()
                println("[SHOPIFY] Publish Response: $publishResponseBody")
            } else {
                println("[SHOPIFY] Could not find 'Online Store' publication ID, skipping publish.")
            }

            val id = productId.removePrefix("gid://shopify/Product/")
            println("[SHOPIFY] Product created successfully: $productId")

            return ShopifyProductResult(
                id = productId,
                handle = handle,
                url = "https://admin.shopify.com/store/${
                    shopDomain.removeSuffix(".myshopify.com")
                }/products/$id"
            )
        } catch (e: Exception) {
            println("[SHOPIFY] Failed to create Shopify product: ${e.message}")
            e.printStackTrace()
            return null
        }
    }

    suspend fun updateProductMedia(productId: String, assets: GeneratedAssets, shopDomain: String, accessToken: String): Boolean {
        if (shopDomain.isBlank() || accessToken.isBlank()) {
            println("[SHOPIFY] Missing credentials, skipping media update")
            return false
        }

        try {
            println("[SHOPIFY] Updating product $productId with media...")

            // Build media array from generated assets
            val mediaItems = buildList {
                // Add hero images if available
                assets.heroImages.forEach { url ->
                    add("""
                        {
                            originalSource: "$url",
                            alt: "${assets.productCopy.description.take(100).replace("\"", "\\\"")}",
                            mediaContentType: IMAGE
                        }
                    """.trimIndent())
                }

                // Add lifestyle images if available
                assets.lifestyleImages.forEach { url ->
                    add("""
                        {
                            originalSource: "$url",
                            alt: "${assets.productCopy.description.take(100).replace("\"", "\\\"")}",
                            mediaContentType: IMAGE
                        }
                    """.trimIndent())
                }

                // Add detail images if available
                assets.detailImages.forEach { url ->
                    add("""
                        {
                            originalSource: "$url",
                            alt: "${assets.productCopy.description.take(100).replace("\"", "\\\"")}",
                            mediaContentType: IMAGE
                        }
                    """.trimIndent())
                }
            }

            if (mediaItems.isEmpty()) {
                println("[SHOPIFY] No media to add")
                return false
            }

            // Build GraphQL mutation for product update with media
            val mutation = """
                mutation {
                  productUpdate(
                    product: {
                      id: "$productId"
                    },
                    media: [
                      ${mediaItems.joinToString(",\n                      ")}
                    ]
                  ) {
                    product {
                      id
                      media(first: 10) {
                        nodes {
                          alt
                          mediaContentType
                          preview {
                            status
                          }
                        }
                      }
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }
            """.trimIndent()

            val apiUrl = "https://${shopDomain}/admin/api/2025-10/graphql.json"

            val response: HttpResponse = client.post(apiUrl) {
                contentType(ContentType.Application.Json)
                header("X-Shopify-Access-Token", accessToken)
                setBody(json.encodeToString(GraphQLRequest.serializer(), GraphQLRequest(mutation)))
            }

            val responseBody = response.bodyAsText()
            println("[SHOPIFY] Media update response: $responseBody")

            val responseJson = json.parseToJsonElement(responseBody).jsonObject
            val data = responseJson["data"]?.jsonObject
            val productUpdate = data?.get("productUpdate")?.jsonObject
            val userErrors = productUpdate?.get("userErrors")?.jsonArray

            if (userErrors != null && userErrors.isNotEmpty()) {
                println("[SHOPIFY] User errors during media update:")
                userErrors.forEach { error ->
                    val errorObj = error.jsonObject
                    println("  - ${errorObj["field"]?.jsonPrimitive?.content}: ${errorObj["message"]?.jsonPrimitive?.content}")
                }
                return false
            }

            println("[SHOPIFY] Media updated successfully for product $productId")
            return true
        } catch (e: Exception) {
            println("[SHOPIFY] Failed to update product media: ${e.message}")
            e.printStackTrace()
            return false
        }
    }

    data class ShopifyReview(
        val id: String,
        val rating: Int,
        val title: String?,
        val body: String?,
        val author: String?,
        val createdAt: String?
    )

    suspend fun getProductReviews(shopifyProductId: String, shopDomain: String, accessToken: String): List<ShopifyReview> {
        if (shopDomain.isBlank() || accessToken.isBlank()) {
            println("[SHOPIFY] Missing credentials, cannot fetch reviews")
            return emptyList()
        }

        return try {
            println("[SHOPIFY] Fetching reviews for product $shopifyProductId from $shopDomain...")

            // Ensure ID is in GID format
            val gid = if (shopifyProductId.startsWith("gid://")) shopifyProductId else "gid://shopify/Product/$shopifyProductId"

            // Query for 'review' metaobjects linked to this product
            // We assume a metaobject definition 'review' exists with fields: product, rating, title, body, author
            val queryStr = "fields.product:'$gid'"

            val graphQLQuery = """
                query GetReviews(${'$'}query: String!) {
                  metaobjects(type: "review", first: 50, query: ${'$'}query) {
                    nodes {
                      id
                      updatedAt
                      rating: field(key: "rating") { value }
                      title: field(key: "title") { value }
                      body: field(key: "body") { value }
                      author: field(key: "author") { value }
                    }
                  }
                }
            """.trimIndent()

            val apiUrl = "https://${shopDomain}/admin/api/2025-10/graphql.json"

            val response: HttpResponse = client.post(apiUrl) {
                contentType(ContentType.Application.Json)
                header("X-Shopify-Access-Token", accessToken)
                setBody(json.encodeToString(GraphQLRequest.serializer(), GraphQLRequest(
                    query = graphQLQuery,
                    variables = buildJsonObject {
                        put("query", queryStr)
                    }
                )))
            }

            val responseBody = response.bodyAsText()
            // println("[SHOPIFY] Reviews Response: $responseBody")

            val responseJson = json.parseToJsonElement(responseBody).jsonObject
            val data = responseJson["data"]?.jsonObject
            val metaobjects = data?.get("metaobjects")?.jsonObject
            val nodes = metaobjects?.get("nodes")?.jsonArray

            val reviews = nodes?.mapNotNull { node ->
                val nodeObj = node.jsonObject
                val id = nodeObj["id"]?.jsonPrimitive?.content ?: return@mapNotNull null
                val ratingStr = nodeObj["rating"]?.jsonObject?.get("value")?.jsonPrimitive?.content
                val title = nodeObj["title"]?.jsonObject?.get("value")?.jsonPrimitive?.content
                val body = nodeObj["body"]?.jsonObject?.get("value")?.jsonPrimitive?.content
                val author = nodeObj["author"]?.jsonObject?.get("value")?.jsonPrimitive?.content
                val updatedAt = nodeObj["updatedAt"]?.jsonPrimitive?.content

                val rating = ratingStr?.toIntOrNull() ?: 0

                ShopifyReview(
                    id = id,
                    rating = rating,
                    title = title,
                    body = body,
                    author = author,
                    createdAt = updatedAt
                )
            } ?: emptyList()

            println("[SHOPIFY] Found ${reviews.size} reviews for product $shopifyProductId")
            reviews
        } catch (e: Exception) {
            println("[SHOPIFY] Failed to fetch reviews: ${e.message}")
            e.printStackTrace()
            emptyList()
        }
    }

    fun close() {
        client.close()
    }
}
