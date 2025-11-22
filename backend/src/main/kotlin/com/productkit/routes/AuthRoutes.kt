package com.productkit.routes

import at.favre.lib.crypto.bcrypt.BCrypt
import com.productkit.models.User
import com.productkit.repositories.UserRepository
import com.productkit.utils.JwtUtil
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.request.*
import kotlinx.coroutines.runBlocking

private val userRepo = UserRepository()

data class AuthRequest(val email: String, val password: String)
data class RefreshRequest(val refreshToken: String)

data class UpdateProfileRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val bio: String? = null,
    val profileImage: String? = null
)

fun Routing.registerAuthRoutes() {
    runBlocking {
        userRepo.ensureIndexes()
    }

    route("/api/auth") {
        post<AuthRequest>("/register") { req ->
            if (!req.email.contains('@') || req.password.length < 6) {
                return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid email or password"))
            }
            val existing = userRepo.findByEmail(req.email)
            if (existing != null) {
                return@post call.respond(HttpStatusCode.Conflict, mapOf("error" to "User already exists"))
            }
            val hash = BCrypt.withDefaults().hashToString(12, req.password.toCharArray())
            val user = userRepo.create(User(email = req.email, passwordHash = hash))

            val token = JwtUtil.generateAccessToken(user._id, user.email)
            val refresh = JwtUtil.generateRefreshToken(user._id)
            call.respond(mapOf("token" to token, "refreshToken" to refresh, "user" to user.copy(passwordHash = "")))
        }

        post<AuthRequest>("/login") { req ->
            val user = userRepo.findByEmail(req.email)
                ?: return@post call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Invalid credentials"))
            val result = BCrypt.verifyer().verify(req.password.toCharArray(), user.passwordHash)
            if (!result.verified) {
                return@post call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Invalid credentials"))
            }
            val token = JwtUtil.generateAccessToken(user._id, user.email)
            val refresh = JwtUtil.generateRefreshToken(user._id)
            call.respond(mapOf("token" to token, "refreshToken" to refresh, "user" to user.copy(passwordHash = "")))
        }

        post<RefreshRequest>("/refresh") { req ->
            val decoded = try { JwtUtil.refreshVerifier.verify(req.refreshToken) } catch (e: Exception) { null }
            if (decoded == null) {
                return@post call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Invalid refresh token"))
            }
            val userId = decoded.subject
            val user = userRepo.findById(userId) ?: return@post call.respond(HttpStatusCode.Unauthorized)
            val token = JwtUtil.generateAccessToken(user._id, user.email)
            val refresh = JwtUtil.generateRefreshToken(user._id)
            call.respond(mapOf("token" to token, "refreshToken" to refresh))
        }

        post("/logout") {
            // With stateless JWT, "logout" is a client-side operation or server-side token blacklist (not implemented)
            call.respond(mapOf("success" to true))
        }

        authenticate("auth-jwt") {
            get("/me") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.subject ?: return@get call.respond(HttpStatusCode.Unauthorized)
                val user = userRepo.findById(userId) ?: return@get call.respond(HttpStatusCode.Unauthorized)
                call.respond(user.copy(passwordHash = ""))
            }

            put<UpdateProfileRequest>("/profile") { req ->
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.subject ?: return@put call.respond(HttpStatusCode.Unauthorized)
                println("Updating profile for user: $userId with data: $req")

                val existing = userRepo.findById(userId) ?: return@put call.respond(HttpStatusCode.NotFound)

                val updated = existing.copy(
                    firstName = req.firstName ?: existing.firstName,
                    lastName = req.lastName ?: existing.lastName,
                    bio = req.bio ?: existing.bio,
                    profileImage = req.profileImage ?: existing.profileImage
                )
                val success = userRepo.update(updated)
                println("Update success: $success")
                call.respond(updated.copy(passwordHash = ""))
            }
        }
    }
}
