package com.productkit.routes

import com.productkit.jobs.GenerationRequest
import com.productkit.jobs.JobManager
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.server.routing.*

data class GenerateAssetsBody(
    val assetTypes: List<String>,
    val count: Map<String, Int> = emptyMap(),
    val style: String? = null
)

fun Route.registerAssetGenerationRoutes() {
    authenticate("auth-jwt") {
        post<GenerateAssetsBody>("/api/products/{productId}/generate-assets") { body ->
            val productId = call.parameters["productId"] ?: return@post call.respond(HttpStatusCode.BadRequest)
            if (body.assetTypes.isEmpty()) return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "assetTypes required"))
            val jobId = JobManager.enqueueAssetsGeneration(productId, GenerationRequest(body.assetTypes, body.count, body.style))
            call.respond(mapOf("jobId" to jobId, "status" to "QUEUED"))
        }
        get("/api/generation-jobs/{jobId}/status") {
            val jobId = call.parameters["jobId"] ?: return@get call.respond(HttpStatusCode.BadRequest)
            val status = JobManager.getStatus(jobId) ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(mapOf("status" to status.status, "progress" to status.progress, "generatedAssets" to status.generatedAssets))
        }
    }
}
