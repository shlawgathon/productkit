package com.productkit.routes

import com.productkit.models.ProductStatus
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
    webSocket("/ws/products/{productId}/status") {
        val productId = call.parameters["productId"] ?: "unknown"
        // Send a greeting and periodic dummy updates. Replace with real job updates later.
        val json = Json { encodeDefaults = true }
        send(Frame.Text(json.encodeToString(StatusMessage.serializer(), StatusMessage(message = "Connected: $productId"))))

        var progress = 0
        while (isActive && progress <= 100) {
            delay(1000)
            progress += 10
            val msg = StatusMessage(
                status = if (progress >= 100) ProductStatus.COMPLETED else ProductStatus.PROCESSING,
                progress = progress.coerceAtMost(100),
                message = "Processing $productId: $progress%"
            )
            send(Frame.Text(json.encodeToString(StatusMessage.serializer(), msg)))
            if (progress >= 100) break
        }

        incoming.consumeEach { /* no-op */ }
        close(CloseReason(CloseReason.Codes.NORMAL, "Done"))
    }
}
