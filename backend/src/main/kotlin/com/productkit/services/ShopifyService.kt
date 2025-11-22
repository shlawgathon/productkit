package com.productkit.services

import ai.fal.client.ClientConfig
import ai.fal.client.kt.*
import com.productkit.utils.Config
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

@Serializable
data class Review(
    val id: String,
    val rating: Int,
    val title: String,
    val body: String,
    val author: String,
    val date: String,
    val verified: Boolean
)

@Serializable
data class ReviewAnalytics(
    val summary: String,
    val keywords: List<String>,
    val improvement: String
)

@Serializable
data class ReviewsResponse(
    val reviews: List<Review>,
    val analytics: ReviewAnalytics
)

class ShopifyService(
    private val fal: FalClient = createFalClient(
        ClientConfig.withCredentials {
            Config.FAL_API_KEY
        }
    )
) {
    private val httpClient = HttpClient(CIO)

    companion object {
        private const val LLM_MODEL = "fal-ai/llama-3-70b-instruct"
        
        // Mock reviews fallback
        private val MOCK_REVIEWS = listOf(
            Review(
                id = "gid://shopify/Metaobject/1",
                rating = 5,
                title = "Absolutely love it!",
                body = "The minimalist design fits perfectly in my living room. The leather quality is top-notch.",
                author = "Sarah J.",
                date = "2023-10-25T14:30:00Z",
                verified = true
            ),
            Review(
                id = "gid://shopify/Metaobject/2",
                rating = 4,
                title = "Great chair, but pricey",
                body = "Comfortable and looks great. Took a bit longer to arrive than expected.",
                author = "Michael B.",
                date = "2023-10-28T09:15:00Z",
                verified = true
            ),
            Review(
                id = "gid://shopify/Metaobject/3",
                rating = 5,
                title = "Worth every penny",
                body = "I was hesitant at first, but the build quality is incredible. Highly recommend.",
                author = "Emily R.",
                date = "2023-11-02T18:45:00Z",
                verified = false
            )
        )
    }

    /**
     * Fetch reviews for a product from Shopify metafields
     * @param productId The Shopify product ID
     * @param shopDomain The user's Shopify store domain (e.g., "mystore.myshopify.com")
     * @param accessToken The user's Shopify access token
     */
    suspend fun getProductReviews(
        productId: String,
        shopDomain: String?,
        accessToken: String?
    ): ReviewsResponse {
        val reviews = fetchReviewsFromShopify(productId, shopDomain, accessToken)
        val analytics = analyzeReviews(reviews)
        
        return ReviewsResponse(
            reviews = reviews,
            analytics = analytics
        )
    }

    /**
     * Fetch reviews from Shopify SPR app metafields
     */
    private suspend fun fetchReviewsFromShopify(
        productId: String,
        shopDomain: String?,
        accessToken: String?
    ): List<Review> {
        if (shopDomain.isNullOrBlank() || accessToken.isNullOrBlank()) {
            println("[ShopifyService] Shopify credentials missing for user, using mock data")
            return MOCK_REVIEWS
        }

        return try {
            val url = "https://$shopDomain/admin/api/2024-04/products/$productId/metafields.json?namespace=spr&key=reviews"
            
            val response: HttpResponse = httpClient.get(url) {
                header("Content-Type", "application/json")
                header("X-Shopify-Access-Token", accessToken)
            }

            if (response.status.isSuccess()) {
                val responseBody = response.bodyAsText()
                val jsonElement = Json.parseToJsonElement(responseBody)
                val metafields = jsonElement.jsonObject["metafields"]?.jsonArray
                
                if (metafields != null && metafields.isNotEmpty()) {
                    val metafieldValue = metafields[0].jsonObject["value"]?.toString() ?: ""
                    extractReviewsFromMetafield(metafieldValue)
                } else {
                    println("[ShopifyService] No metafields found, using mock data")
                    MOCK_REVIEWS
                }
            } else {
                println("[ShopifyService] Shopify API error ${response.status}, using mock data")
                MOCK_REVIEWS
            }
        } catch (e: Exception) {
            println("[ShopifyService] Failed to fetch Shopify reviews: ${e.message}")
            e.printStackTrace()
            MOCK_REVIEWS
        }
    }

    /**
     * Extract reviews from metafield HTML/JSON string
     */
    private fun extractReviewsFromMetafield(html: String): List<Review> {
        return try {
            // Try to find JSON array in the HTML string
            val jsonMatch = Regex("""\[\{[\s\S]*?\}\]""").find(html)
            if (jsonMatch != null) {
                val jsonArray = Json.parseToJsonElement(jsonMatch.value).jsonArray
                jsonArray.map { element ->
                    val obj = element.jsonObject
                    Review(
                        id = obj["id"]?.toString()?.trim('"') ?: "",
                        rating = obj["rating"]?.toString()?.toIntOrNull() ?: 0,
                        title = obj["title"]?.toString()?.trim('"') ?: "",
                        body = obj["body"]?.toString()?.trim('"') ?: "",
                        author = obj["author"]?.toString()?.trim('"') ?: "",
                        date = obj["date"]?.toString()?.trim('"') ?: "",
                        verified = obj["verified"]?.toString()?.toBoolean() ?: false
                    )
                }
            } else {
                println("[ShopifyService] No JSON found in metafield, using mock data")
                MOCK_REVIEWS
            }
        } catch (e: Exception) {
            println("[ShopifyService] Failed to parse reviews from metafield: ${e.message}")
            MOCK_REVIEWS
        }
    }

    /**
     * Analyze reviews using Fal AI LLM
     */
    private suspend fun analyzeReviews(reviews: List<Review>): ReviewAnalytics {
        if (reviews.isEmpty()) {
            return ReviewAnalytics(
                summary = "No reviews available for analysis yet.",
                keywords = emptyList(),
                improvement = "N/A"
            )
        }

        // Prepare text for AI analysis
        val reviewsText = reviews.joinToString("\n\n") { review ->
            "Rating: ${review.rating}/5\nTitle: ${review.title}\nReview: ${review.body}"
        }

        // Try to use AI analysis if FAL_KEY is available
        if (Config.FAL_API_KEY != null) {
            return try {
                val prompt = """
                    You are an expert product analyst. Analyze the following customer reviews for a product.
                    
                    Reviews:
                    $reviewsText
                    
                    Provide a JSON object with the following fields:
                    - summary: a concise 1-2 sentence sentiment summary
                    - keywords: an array of 3-5 short key themes
                    - improvement: a sentence describing a key area for improvement, if any.
                    Return ONLY the JSON object, no extra text.
                """.trimIndent()

                val result = fal.subscribe(
                    endpointId = LLM_MODEL,
                    input = mapOf(
                        "prompt" to prompt,
                        "max_tokens" to 512,
                        "temperature" to 0.1
                    ),
                    options = SubscribeOptions(logs = true)
                ) { update ->
                    // Log progress if needed
                    println("[ShopifyService] AI Analysis: $update")
                }

                var jsonString = result.data.toString()
                    .replace("```json", "")
                    .replace("```", "")
                    .trim()
                
                // Try to extract just the JSON object if there's extra text
                val jsonMatch = Regex("""\{[\s\S]*?\}""").find(jsonString)
                if (jsonMatch != null) {
                    jsonString = jsonMatch.value
                }

                Json.decodeFromString<ReviewAnalytics>(jsonString)
            } catch (e: Exception) {
                println("[ShopifyService] Fal.ai API error: ${e.message}")
                e.printStackTrace()
                generateFallbackAnalytics(reviews)
            }
        } else {
            println("[ShopifyService] FAL_KEY not configured, using fallback analytics")
            return generateFallbackAnalytics(reviews)
        }
    }

    /**
     * Generate basic analytics without AI
     */
    private fun generateFallbackAnalytics(reviews: List<Review>): ReviewAnalytics {
        val averageRating = reviews.map { it.rating }.average()
        
        val allText = reviews.joinToString(" ") { "${it.body} ${it.title}" }.lowercase()
        
        // Simple keyword extraction
        val potentialKeywords = listOf("comfortable", "quality", "sleek", "modern", "great", "love", "perfect", "leather", "design", "sturdy")
        val foundKeywords = potentialKeywords
            .filter { allText.contains(it) }
            .take(5)
            .map { it.replaceFirstChar { char -> char.uppercase() } }
        
        val summary = when {
            averageRating >= 4.8 -> "Customers are overwhelmingly positive, frequently praising the exceptional quality and design."
            averageRating >= 4.0 -> "The majority of customers are satisfied, highlighting the product's aesthetic and comfort."
            averageRating >= 3.0 -> "Reviews are generally positive, though some customers have mixed feelings about the value."
            else -> "Recent feedback indicates some customers are facing issues with the product."
        }
        
        val negativeContexts = listOf("shipping", "delay", "price", "expensive", "color", "size")
        val foundIssues = negativeContexts.filter { allText.contains(it) }
        val improvement = if (foundIssues.isNotEmpty()) {
            "Some users noted concerns regarding ${foundIssues.joinToString(", ")}."
        } else {
            "No significant recurring complaints found."
        }
        
        return ReviewAnalytics(
            summary = summary,
            keywords = foundKeywords.ifEmpty { listOf("Design", "Quality") },
            improvement = improvement
        )
    }

    fun close() {
        httpClient.close()
    }
}
