package com.productkit

import com.productkit.routes.registerAuthRoutes
import com.productkit.routes.registerHealthRoutes
import com.productkit.routes.registerProductRoutes
import com.productkit.routes.registerSettingsRoutes
import com.productkit.routes.registerWebsocketRoutes
import com.productkit.routes.registerAssetGenerationRoutes
import com.productkit.routes.registerUploadRoutes
import com.productkit.routes.registerReviewRoutes
import com.productkit.utils.Config
import com.productkit.utils.JwtUtil
import io.ktor.serialization.jackson.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.ratelimit.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import org.slf4j.event.Level
import java.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

fun main() {
    embeddedServer(Netty, port = Config.PORT) { module() }.start(wait = true)
}

fun Application.module() {
    install(DefaultHeaders)
    install(ContentNegotiation) { jackson() }
    install(CORS) {
        allowHost(Config.FRONTEND_HOST, listOf("https"))
        allowHost(Config.FRONTEND_HOST, listOf("http"))
        allowCredentials = true
        allowNonSimpleContentTypes = true
        anyHost() // fallback for local dev; consider removing in production
        allowHeaders { true }
        allowMethod(io.ktor.http.HttpMethod.Options)
        allowMethod(io.ktor.http.HttpMethod.Put)
        allowMethod(io.ktor.http.HttpMethod.Delete)
        allowMethod(io.ktor.http.HttpMethod.Patch)
    }
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.application.environment.log.error("Unhandled error", cause)
            call.respond(io.ktor.http.HttpStatusCode.InternalServerError, mapOf("error" to (cause.message ?: "internal error")))
        }
    }
    install(WebSockets) { pingPeriod = 30.seconds }
    install(RateLimit) {
        register(name = RateLimitName("per-user")) {
            rateLimiter(limit = 100, refillPeriod = 1.minutes)
            requestKey { call ->
                val principal = call.principal<JWTPrincipal>()
                principal?.subject ?: (call.request.headers["X-Forwarded-For"] ?: "guest")
            }
        }
    }
    install(Authentication) {
        jwt("auth-jwt") {
            verifier(JwtUtil.accessVerifier)
            validate { cred -> if (!cred.payload.subject.isNullOrBlank()) JWTPrincipal(cred.payload) else null }
            challenge { _, _ -> call.respond(io.ktor.http.HttpStatusCode.Unauthorized, mapOf("error" to "Invalid or expired token")) }
        }
    }

    routing {
        registerHealthRoutes()
        registerAuthRoutes()
        authenticate("auth-jwt") {
            rateLimit(RateLimitName("per-user")) {
                route("/") {
                    registerProductRoutes()
                    registerSettingsRoutes()
                    registerReviewRoutes()
                }
                // Other secured routes will be registered here (Shopify, Site, Settings, Upload)
            }
        }
        // WebSockets do not require auth for now; can be upgraded later
        registerWebsocketRoutes()
        registerAssetGenerationRoutes()
        registerUploadRoutes()
    }
}
