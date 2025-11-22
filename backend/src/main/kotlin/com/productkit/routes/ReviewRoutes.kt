package com.productkit.routes

import com.productkit.services.ShopifyService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

private val shopifyService = ShopifyService()

fun Route.registerReviewRoutes() {
    route("/api/reviews") {
        /**
         * GET /api/reviews?productId={productId}
         * Fetch reviews and analytics for a product
         */
        get {
            val productId = call.request.queryParameters["productId"]
            
            if (productId.isNullOrBlank()) {
                return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "productId query parameter is required")
                )
            }

            try {
                val response = shopifyService.getProductReviews(productId)
                call.respond(HttpStatusCode.OK, response)
            } catch (e: Exception) {
                println("[ReviewRoutes] Error fetching reviews: ${e.message}")
                e.printStackTrace()
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("error" to "Failed to fetch reviews: ${e.message}")
                )
            }
        }
    }
}
