package com.productkit.services

import com.productkit.utils.HttpClientProvider
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.kotest.core.spec.style.StringSpec
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.http.*
import io.ktor.serialization.jackson.*

class FalServiceTest : StringSpec({
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

    "generateProductImages returns list of urls on success" {
        val body = """
            { "images": [ {"url": "https://cdn/img1.jpg"}, {"url": "https://cdn/img2.jpg"} ] }
        """.trimIndent()
        server.enqueue(MockResponse().setResponseCode(200).setBody(body).addHeader("Content-Type", "application/json"))

        val baseUrl = server.url("/").toString().removeSuffix("/")
        val service = FalService(client = client, apiKey = "TEST_KEY", baseUrl = baseUrl)
        val result = service.generateProductImages("p1", "https://base.jpg", "hero", 2)
        result.shouldContainExactly("https://cdn/img1.jpg", "https://cdn/img2.jpg")

        val recorded = server.takeRequest()
        recorded.getHeader("Authorization") shouldBe "Key TEST_KEY"
        recorded.method shouldBe "POST"
    }

    "generateConsistentVariations handles single image field and iterates contexts" {
        val body = """
            { "image": {"url": "https://cdn/only.jpg"} }
        """.trimIndent()
        // two contexts => two calls
        server.enqueue(MockResponse().setResponseCode(200).setBody(body).addHeader("Content-Type", "application/json"))
        server.enqueue(MockResponse().setResponseCode(200).setBody(body).addHeader("Content-Type", "application/json"))

        val service = FalService(client = client, apiKey = "TEST_KEY", baseUrl = server.url("/").toString().removeSuffix("/"))
        val result = service.generateConsistentVariations("p1", "embed", listOf("context A", "context B"))
        result.shouldHaveSize(2)
        result[0] shouldBe "https://cdn/only.jpg"
        result[1] shouldBe "https://cdn/only.jpg"

        server.takeRequest().getHeader("Authorization") shouldBe "Key TEST_KEY"
        server.takeRequest().getHeader("Authorization") shouldBe "Key TEST_KEY"
    }

    "throws when API key missing" {
        val service = FalService(client = client, apiKey = null, baseUrl = server.url("/").toString())
        shouldThrow<IllegalStateException> {
            service.generateProductImages("p1", "img", "hero", 1)
        }.message.shouldContain("FAL_API_KEY is not set")
    }
})
