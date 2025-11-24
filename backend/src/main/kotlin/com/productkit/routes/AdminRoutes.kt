package com.productkit.routes

import com.productkit.models.AccessCode
import com.productkit.models.UserRole
import com.productkit.repositories.AccessCodeRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID
import java.util.concurrent.TimeUnit

private val accessCodeRepo = AccessCodeRepository()

fun Routing.registerAdminRoutes() {
    route("/api/admin") {
        authenticate("auth-jwt") {
            // Middleware to check for ADMIN role
            intercept(ApplicationCallPipeline.Call) {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                if (role != UserRole.ADMIN.name) {
                    call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Admin access required"))
                    finish()
                }
            }

            post("/codes") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.subject ?: return@post call.respond(HttpStatusCode.Unauthorized)
                
                val codeStr = UUID.randomUUID().toString().substring(0, 8).uppercase()
                val expiresAt = System.currentTimeMillis() + TimeUnit.HOURS.toMillis(24)
                
                val accessCode = AccessCode(
                    code = codeStr,
                    createdBy = userId,
                    expiresAt = expiresAt
                )
                
                accessCodeRepo.create(accessCode)
                call.respond(accessCode)
            }

            get("/codes") {
                val codes = accessCodeRepo.findAll()
                call.respond(codes)
            }
        }
    }
}
