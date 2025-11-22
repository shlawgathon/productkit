package com.productkit.utils

import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.jackson.*

object HttpClientProvider {
    val client: HttpClient by lazy {
        HttpClient(CIO) {
            install(ContentNegotiation) { jackson() }
            install(Logging) {
                logger = Logger.DEFAULT
                level = LogLevel.INFO
            }
            engine {
                requestTimeout = 60_000
            }
        }
    }
}
