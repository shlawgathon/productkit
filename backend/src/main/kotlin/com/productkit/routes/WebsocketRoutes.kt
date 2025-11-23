package com.productkit.routes

import com.productkit.jobs.JobManager
import com.productkit.jobs.JobStep
import com.productkit.models.ProductStatus
import com.productkit.repositories.ProductRepository
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.channels.consumeEach
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

@Serializable
data class StatusMessage(
    val type: String = "status_update",
    val status: ProductStatus = ProductStatus.PROCESSING,
    val progress: Int = 0,
    val message: String = "",
    val steps: List<JobStep> = emptyList()
)

fun Routing.registerWebsocketRoutes() {
    val productRepo = ProductRepository()
    
    webSocket("/ws/products/{productId}/status") {
        val productId = call.parameters["productId"] ?: "unknown"
        val json = Json { encodeDefaults = true }
        
        println("[WEBSOCKET] Client connected for product $productId")
        send(Frame.Text(json.encodeToString(StatusMessage.serializer(), StatusMessage(message = "Connected: $productId"))))

        var lastStatus: ProductStatus? = null
        var lastProgress = 0
        var lastStepCount = 0
        
        while (isActive) {
            try {
                // Check active job status first
                val jobStatus = JobManager.getStatusByProductId(productId)
                
                if (jobStatus != null && jobStatus.status != "COMPLETED" && jobStatus.status != "ERROR") {
                    // Active job found
                    val currentStep = jobStatus.steps.find { it.status == "RUNNING" }
                    val message = currentStep?.name ?: "Processing..."
                    
                    val msg = StatusMessage(
                        status = ProductStatus.PROCESSING,
                        progress = jobStatus.progress,
                        message = message,
                        steps = jobStatus.steps
                    )
                    
                    send(Frame.Text(json.encodeToString(StatusMessage.serializer(), msg)))
                    // println("[WEBSOCKET] Sent detailed update for $productId: ${jobStatus.progress}%")
                    
                    delay(250) // Poll faster for active jobs
                } else {
                    // Fallback to database status
                    val product = productRepo.findById(productId)
                    
                    if (product == null) {
                        send(Frame.Text(json.encodeToString(StatusMessage.serializer(), 
                            StatusMessage(
                                status = ProductStatus.ERROR,
                                progress = 0,
                                message = "Product not found"
                            )
                        )))
                        break
                    }
                    
                    val currentStatus = product.status
                    val progress = when (currentStatus) {
                        ProductStatus.DRAFT -> 0
                        ProductStatus.PROCESSING -> 20
                        ProductStatus.GENERATING_IMAGES -> 40
                        ProductStatus.GENERATING_COPY -> 60
                        ProductStatus.GENERATING_SITE -> 75
                        ProductStatus.SYNCING_SHOPIFY -> 85
                        ProductStatus.COMPLETED -> 100
                        ProductStatus.POST_COMPLETION_ASSETS -> 95
                        ProductStatus.ERROR -> lastProgress
                    }
                    
                    // If we have a completed job status, use its steps
                    val finalSteps = jobStatus?.steps ?: emptyList()

                    // Only send update if status or progress changed
                    if (currentStatus != lastStatus || progress != lastProgress || finalSteps.size != lastStepCount) {
                        val message = when (currentStatus) {
                            ProductStatus.DRAFT -> "Product is in draft"
                            ProductStatus.PROCESSING -> "Processing product..."
                            ProductStatus.GENERATING_IMAGES -> "Generating product images..."
                            ProductStatus.GENERATING_COPY -> "Creating marketing copy..."
                            ProductStatus.GENERATING_SITE -> "Building product site..."
                            ProductStatus.SYNCING_SHOPIFY -> "Syncing to Shopify..."
                            ProductStatus.COMPLETED -> "Product ready!"
                            ProductStatus.POST_COMPLETION_ASSETS -> "Finalizing 3D models and videos..."
                            ProductStatus.ERROR -> "An error occurred"
                        }
                        
                        val msg = StatusMessage(
                            status = currentStatus,
                            progress = progress,
                            message = message,
                            steps = finalSteps
                        )
                        
                        send(Frame.Text(json.encodeToString(StatusMessage.serializer(), msg)))
                        println("[WEBSOCKET] Sent update for $productId: $currentStatus ($progress%)")
                        
                        lastStatus = currentStatus
                        lastProgress = progress
                        lastStepCount = finalSteps.size
                    }
                    
                    // If completed or error, close the connection
                    if (currentStatus == ProductStatus.COMPLETED || currentStatus == ProductStatus.ERROR) {
                        delay(500) // Give client time to process final message
                        break
                    }
                    
                    delay(1000) // Poll every second
                }
            } catch (e: Exception) {
                println("[WEBSOCKET] Error in websocket for $productId: ${e.message}")
                e.printStackTrace()
                break
            }
        }

        incoming.consumeEach { /* no-op */ }
        close(CloseReason(CloseReason.Codes.NORMAL, "Done"))
        println("[WEBSOCKET] Client disconnected for product $productId")
    }
}
