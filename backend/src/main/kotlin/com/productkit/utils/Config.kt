package com.productkit.utils

import io.github.cdimascio.dotenv.dotenv

object Config {
    private val dotenv = dotenv {
        ignoreIfMissing = true
        systemProperties = true
        filename = ".env"
    }

    val PORT: Int = (dotenv["PORT"] ?: "8080").toInt()
    val FRONTEND_URL: String = dotenv["FRONTEND_URL"] ?: "http://localhost:3000"
    val FRONTEND_HOST: String = FRONTEND_URL.removePrefix("https://").removePrefix("http://")

    val MONGODB_URI: String = dotenv["MONGODB_URI"] ?: "mongodb://localhost:27017/productkit"

    val JWT_SECRET: String = dotenv["JWT_SECRET"] ?: "dev-secret-access"
    val JWT_REFRESH_SECRET: String = dotenv["JWT_REFRESH_SECRET"] ?: "dev-secret-refresh"
    val ACCESS_TOKEN_TTL_MS: Long = 60 * 60 * 1000L // 1 hour
    val REFRESH_TOKEN_TTL_MS: Long = 7 * 24 * 60 * 60 * 1000L // 7 days

    val FAL_API_KEY: String? = dotenv["FAL_KEY"]
    val NVIDIA_API_KEY: String? = dotenv["NVIDIA_API_KEY"]
    val ANTHROPIC_API_KEY: String? = dotenv["ANTHROPIC_API_KEY"]

    val DO_SPACES_KEY: String? = dotenv["DO_SPACES_KEY"]
    val DO_SPACES_SECRET: String? = dotenv["DO_SPACES_SECRET"]
    val DO_SPACES_ENDPOINT: String? = dotenv["DO_SPACES_ENDPOINT"]
    val DO_SPACES_BUCKET: String? = dotenv["DO_SPACES_BUCKET"]
}
