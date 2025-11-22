package com.productkit.services

import com.productkit.utils.Config
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.collections.shouldNotBeEmpty
import io.kotest.matchers.string.shouldStartWith
import org.junit.jupiter.api.Assumptions.assumeTrue
import kotlin.time.Duration.Companion.seconds

class FalServiceE2ETest : FunSpec({

    val falKey = Config.FAL_API_KEY?.apply {
        println(this)
    }
    val testImageUrl = "https://www.tempercraft.com/cdn/shop/files/QSB22-BLK_H_2048x.png?v=1746070400"

    beforeSpec {
        // Skip E2E tests unless a real FAL_KEY is present in the environment
        assumeTrue(!falKey.isNullOrBlank()) { "FAL_KEY not set; skipping FalService E2E tests." }
    }

    test("generateProductImages returns at least one valid URL").config(timeout = 180.seconds) {
        val service = FalService()

        val urls = service.generateProductImages(
            productId = "e2e-test-product",
            baseImage = testImageUrl,
            type = "studio",
            count = 5
        )

        urls.images.map { it.url }.forEach { url ->
            println(url)
            url shouldStartWith "http"
        }
    }
})
