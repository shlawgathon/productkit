package com.productkit.services

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.jackson.*
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer

class NvidiaServiceTest : StringSpec({
    lateinit var server: MockWebServer
    lateinit var client: HttpClient

    beforeTest {
        server = MockWebServer()
        server.start()
        client = HttpClient(CIO) {
            install(ContentNegotiation) { jackson() }
            install(Logging) {
                logger = Logger.DEFAULT
                level = LogLevel.BODY
            }
        }
    }

    afterTest {
        client.close()
        server.shutdown()
    }

    "generate3DModel returns model url and sends auth" {
        val body = """{ "modelUrl": "https://cdn/models/p1.glb" }"""
        server.enqueue(MockResponse().setResponseCode(200).setBody(body).addHeader("Content-Type", "application/json"))

        val base = server.url("/").toString().removeSuffix("/")
        val svc = NvidiaService(client = client, apiKey = "NV_KEY", baseUrl = base)
        val url = svc.generate3DModel("https://cdn/img.jpg")
        url shouldBe "https://cdn/models/p1.glb"

        val recorded = server.takeRequest()
        recorded.getHeader("Authorization") shouldBe "Bearer NV_KEY"
        recorded.method shouldBe "POST"
        recorded.path shouldContain "/3d"
    }

    "generateProductCopy returns structured copy" {
        val body = """
            {"headline":"H1","subheadline":"H2","description":"Desc","features":["A","B"],"benefits":["C","D"]}
        """.trimIndent()
        server.enqueue(MockResponse().setResponseCode(200).setBody(body).addHeader("Content-Type", "application/json"))

        val base = server.url("/").toString().removeSuffix("/")
        val svc = NvidiaService(client = client, apiKey = "NV_KEY", baseUrl = base)
        val copy = svc.generateProductCopy("Prod", listOf("A","B"))
        copy.headline shouldBe "H1"
        copy.subheadline shouldBe "H2"
        copy.description shouldBe "Desc"
        copy.features[0] shouldBe "A"
        copy.benefits[1] shouldBe "D"
    }

    "throws when NVIDIA_API_KEY missing" {
        val base = server.url("/").toString().removeSuffix("/")
        val svc = NvidiaService(client = client, apiKey = null, baseUrl = base)
        shouldThrow<IllegalStateException> { svc.generate3DModel("img") }.message.shouldContain("NVIDIA_API_KEY is not set")
    }
})
