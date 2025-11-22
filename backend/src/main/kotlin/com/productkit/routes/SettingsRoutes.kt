package com.productkit.routes

import com.productkit.models.BrandGuidelines
import com.productkit.models.UserSettings
import com.productkit.repositories.SettingsRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.concurrent.ConcurrentHashMap

private val settingsRepo = SettingsRepository()

fun Route.registerSettingsRoutes() {
    route("/api/settings") {
        get {
            val principal = call.principal<JWTPrincipal>()
            val userId = principal?.subject ?: return@get call.respond(HttpStatusCode.Unauthorized)
            val settings = settingsRepo.get(userId) ?: UserSettings(userId)
            call.respond(settings)
        }
        put {
            val principal = call.principal<JWTPrincipal>()
            val userId = principal?.subject ?: return@put call.respond(HttpStatusCode.Unauthorized)
            val body = call.receive<UserSettings>().copy(userId = userId)
            settingsRepo.upsert(body)
            call.respond(body)
        }
        put<BrandGuidelines>("/brand") { brand ->
            val principal = call.principal<JWTPrincipal>()
            val userId = principal?.subject ?: return@put call.respond(HttpStatusCode.Unauthorized)
            val existing = settingsRepo.get(userId) ?: UserSettings(userId)
            val updated = existing.copy(brandGuidelines = brand)
            settingsRepo.upsert(updated)
            call.respond(mapOf("success" to true))
        }
    }
}
