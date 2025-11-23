package com.productkit.routes

import com.productkit.models.Product
import com.productkit.models.ProductStatus
import com.productkit.repositories.ProductRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.concurrent.ConcurrentHashMap

private val productRepo = ProductRepository()

data class CreateProductRequest(val name: String, val description: String? = null, val images: List<String> = emptyList(), val pdfGuides: List<String> = emptyList())
data class UpdateProductRequest(val name: String? = null, val description: String? = null, val images: List<String>? = null)

fun Route.registerProductRoutes() {
    route("/api/products") {
        get {
            val principal = call.principal<JWTPrincipal>()
            val userId = principal?.subject ?: return@get call.respond(HttpStatusCode.Unauthorized)
            val list = productRepo.findByUser(userId)
            call.respond(mapOf("products" to list))
        }

        get("/{productId}") {
            val id = call.parameters["productId"] ?: return@get call.respond(HttpStatusCode.BadRequest)
            val product = productRepo.findById(id) ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(product)
        }

        post<CreateProductRequest>("/create") { req ->
            val principal = call.principal<JWTPrincipal>()
            val userId = principal?.subject ?: return@post call.respond(HttpStatusCode.Unauthorized)
            if (req.name.isBlank() || req.images.isEmpty()) {
                return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "name and images are required"))
            }
            val product = productRepo.create(
                Product(
                    userId = userId,
                    name = req.name,
                    description = req.description,
                    originalImages = req.images,
                    pdfGuides = req.pdfGuides,
                    status = ProductStatus.PROCESSING
                )
            )

            // Enqueue job processing
            com.productkit.jobs.JobManager.enqueueAssetsGeneration(
                product._id,
                com.productkit.jobs.GenerationRequest(
                    assetTypes = listOf("hero", "360"),
                    count = mapOf("hero" to 5, "360" to 1)
                )
            )

            call.respond(mapOf("productId" to product._id, "status" to product.status.name))
        }

        put<UpdateProductRequest>("/{productId}") { req ->
            val id = call.parameters["productId"] ?: return@put call.respond(HttpStatusCode.BadRequest)
            val existing = productRepo.findById(id) ?: return@put call.respond(HttpStatusCode.NotFound)
            val updated = existing.copy(
                name = req.name ?: existing.name,
                description = req.description ?: existing.description,
                originalImages = req.images ?: existing.originalImages,
                updatedAt = System.currentTimeMillis()
            )
            productRepo.update(updated)
            call.respond(updated)
        }

        delete("/{productId}") {
            val id = call.parameters["productId"] ?: return@delete call.respond(HttpStatusCode.BadRequest)
            val removed = productRepo.delete(id)
            call.respond(mapOf("success" to removed))
        }

        post("/{productId}/regenerate") {
            val id = call.parameters["productId"] ?: return@post call.respond(HttpStatusCode.BadRequest)
            val existing = productRepo.findById(id) ?: return@post call.respond(HttpStatusCode.NotFound)
            val updated = existing.copy(status = ProductStatus.PROCESSING, updatedAt = System.currentTimeMillis())
            productRepo.update(updated)
            call.respond(mapOf("productId" to id, "status" to ProductStatus.PROCESSING.name))
        }

        get("/{productId}/status") {
            val id = call.parameters["productId"] ?: return@get call.respond(HttpStatusCode.BadRequest)
            val p = productRepo.findById(id) ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(mapOf("status" to p.status, "progress" to 10, "currentStep" to p.status.name))
        }
    }
}
