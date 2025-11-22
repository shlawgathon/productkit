package com.productkit.utils

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import java.util.*

object JwtUtil {
    private val accessAlg = Algorithm.HMAC256(Config.JWT_SECRET)
    private val refreshAlg = Algorithm.HMAC256(Config.JWT_REFRESH_SECRET)

    val accessVerifier: JWTVerifier = JWT.require(accessAlg).withIssuer("productkit").build()
    val refreshVerifier: JWTVerifier = JWT.require(refreshAlg).withIssuer("productkit").build()

    fun generateAccessToken(userId: String, email: String): String {
        val now = System.currentTimeMillis()
        return JWT.create()
            .withIssuer("productkit")
            .withSubject(userId)
            .withClaim("email", email)
            .withIssuedAt(Date(now))
            .withExpiresAt(Date(now + Config.ACCESS_TOKEN_TTL_MS))
            .sign(accessAlg)
    }

    fun generateRefreshToken(userId: String): String {
        val now = System.currentTimeMillis()
        return JWT.create()
            .withIssuer("productkit")
            .withSubject(userId)
            .withIssuedAt(Date(now))
            .withExpiresAt(Date(now + Config.REFRESH_TOKEN_TTL_MS))
            .sign(refreshAlg)
    }
}
