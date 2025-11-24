package com.productkit.services

import com.productkit.utils.Config
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.util.concurrent.TimeUnit

class NvidiaService {
    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val json = Json { ignoreUnknownKeys = true }

    companion object {
        private const val NIM_URL = "https://ai.api.nvidia.com/v1/retrieval/nvidia/ingest"
    }

    suspend fun parsePdf(pdfUrl: String): String {
        return kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                val apiKey = Config.NVIDIA_API_KEY ?: throw IllegalStateException("NVIDIA_API_KEY not configured")
                val requestBody = """
                    {
                        "model": "nvidia/nemotron-4-340b-instruct",
                        "messages": [{"role":"user", "content":"Please read the PDF at $pdfUrl and extract all the text content, preserving structure as much as possible."}],
                        "temperature": 0.2,
                        "top_p": 0.7,
                        "max_tokens": 1024
                    }
                """.trimIndent().toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url("https://integrate.api.nvidia.com/v1/chat/completions")
                    .addHeader("Authorization", "Bearer $apiKey")
                    .addHeader("Content-Type", "application/json")
                    .post(requestBody)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        throw RuntimeException("NVIDIA API request failed: ${response.code} ${response.body?.string()}")
                    }

                    val responseBody = response.body?.string() ?: ""
                    val jsonResponse = json.parseToJsonElement(responseBody).jsonObject
                    val choices = jsonResponse["choices"]?.jsonArray
                    val content = choices?.get(0)?.jsonObject?.get("message")?.jsonObject?.get("content")?.jsonPrimitive?.content

                    content ?: ""
                }
            } catch (e: Exception) {
                println("[NvidiaService] Error parsing PDF: ${e.message}")
                e.printStackTrace()
                ""
            }
        }
    }
}
