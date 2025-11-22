package com.productkit.routes

import com.productkit.repositories.UserRepository
import com.productkit.services.ShopifyService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

private val shopifyService = ShopifyService()
private val userRepo = UserRepository()

fun Route.registerReviewRoutes() {
    route("/api/reviews") {
        /**
         * GET /api/reviews?productId={productId}
         * Fetch reviews and analytics for a product
         */
        get {
            val principal = call.principal<JWTPrincipal>()
            val userId = principal?.subject ?: return@get call.respond(HttpStatusCode.Unauthorized)

            val productId = call.request.queryParameters["productId"]

            if (productId.isNullOrBlank()) {
                return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "productId query parameter is required")
                )
            }

            try {
                // Fetch user's Shopify credentials
                val user = userRepo.findById(userId)
                val shopDomain = user?.shopifyStoreUrl
                val accessToken = user?.shopifyAccessToken

                val response = shopifyService.getProductReviews(productId, shopDomain!!, accessToken = accessToken!!)
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
