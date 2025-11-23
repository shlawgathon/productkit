package com.productkit.routes

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
    val message: String = ""
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
        
        while (isActive) {
            try {
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
                
                // Only send update if status or progress changed
                if (currentStatus != lastStatus || progress != lastProgress) {
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
                        message = message
                    )
                    
                    send(Frame.Text(json.encodeToString(StatusMessage.serializer(), msg)))
                    println("[WEBSOCKET] Sent update for $productId: $currentStatus ($progress%)")
                    
                    lastStatus = currentStatus
                    lastProgress = progress
                }
                
                // If completed or error, close the connection
                // Keep open for POST_COMPLETION_ASSETS to continue monitoring
                if (currentStatus == ProductStatus.COMPLETED || currentStatus == ProductStatus.ERROR) {
                    delay(500) // Give client time to process final message
                    break
                }
                
                delay(1000) // Poll every second
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
