package com.productkit.services

import com.anthropic.client.AnthropicClient
import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.core.JsonValue
import com.anthropic.models.*
import com.anthropic.models.messages.ContentBlock
import com.anthropic.models.messages.ContentBlockParam
import com.anthropic.models.messages.ImageBlockParam
import com.anthropic.models.messages.MessageCreateParams
import com.anthropic.models.messages.MessageParam
import com.anthropic.models.messages.TextBlockParam
import com.anthropic.models.messages.UrlImageSource
import java.net.URL
import java.util.Base64
import com.productkit.utils.Config
import kotlin.jvm.optionals.getOrNull

class AnthropicService(
    private val client: AnthropicClient = AnthropicOkHttpClient.builder()
        .apiKey(Config.ANTHROPIC_API_KEY ?: throw IllegalStateException("ANTHROPIC_API_KEY not configured"))
        .build()
) {
    companion object {
        private const val DEFAULT_MODEL = "claude-sonnet-4-5-20250929"
        private const val DEFAULT_MAX_TOKENS = 1024
    }

    /**
     * Generate text completion using Claude
     *
     * @param prompt The prompt to send to Claude
     * @param maxTokens Maximum tokens to generate (default: 1024)
     * @param temperature Temperature for generation (default: 0.7)
     * @param systemPrompt Optional system prompt to guide the model
     * @return The generated text response
     */
    suspend fun generateText(
        prompt: String,
        maxTokens: Int = DEFAULT_MAX_TOKENS,
        temperature: Double = 0.7,
        systemPrompt: String? = null
    ): String {
        return kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                val messageParams = MessageCreateParams.builder()
                    .model(DEFAULT_MODEL)
                    .maxTokens(maxTokens.toLong())
                    .temperature(temperature)
                    .messages(
                        listOf(
                            MessageParam.builder()
                                .role(MessageParam.Role.USER)
                                .content(prompt)
                                .build()
                        )
                    )

                // Add system prompt if provided
                if (systemPrompt != null) {
                    messageParams.system(systemPrompt)
                }

                val message = client.messages().create(messageParams.build())

                // Extract text from the response
                val textContent = message.content().firstOrNull()
                    ?: throw IllegalStateException("Unexpected response format from Anthropic API")
                if (textContent.isText()) {
                    textContent.text().getOrNull()?.text() ?: ""
                } else {
                    throw IllegalStateException("Unexpected response format from Anthropic API")
                }
            } catch (e: Exception) {
                println("[AnthropicService] Error generating text: ${e.message}")
                e.printStackTrace()
                throw e
            }
        }
    }

    /**
     * Understand an image using Claude Vision
     *
     * @param imageUrl URL of the image to analyze
     * @return Description of the image
     */
    suspend fun understandImage(imageUrl: String): String {
        return kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                // Download image
                val url = URL(imageUrl)
                val messageParams = MessageCreateParams.builder()
                    .model(DEFAULT_MODEL)
                    .maxTokens(1024)
                    .messages(
                        listOf(
                            MessageParam.builder()
                                .role(MessageParam.Role.USER)
                                .content(MessageParam.Content.ofBlockParams(
                                    listOf(
                                        ContentBlockParam.ofImage(ImageBlockParam
                                            .builder()
                                            .source(UrlImageSource.builder()
                                                .url(imageUrl)
                                                .build())
                                            .build()),
                                        ContentBlockParam.ofText(TextBlockParam.builder()
                                            .text("Describe this product image in detail. Focus on visual characteristics, style, material, and setting.")
                                            .build())
                                    )
                                ))
                                .build()
                        )
                    )
                    .build()

                val message = client.messages().create(messageParams)

                val textContent = message.content().firstOrNull()
                    ?: throw IllegalStateException("Unexpected response format from Anthropic API")

                if (textContent.isText()) {
                    textContent.text().getOrNull()?.text() ?: ""
                } else {
                    ""
                }
            } catch (e: Exception) {
                println("[AnthropicService] Error understanding image: ${e.message}")
                e.printStackTrace()
                "A high quality product image"
            }
        }
    }

    /**
     * Generate marketing prompts from a description
     *
     * @param description The product description
     * @return List of generated prompts
     */
    suspend fun generatePromptsFromDescription(description: String): List<String> {
        if (description.isBlank()) return emptyList()

        val prompt = """
            Based on the following description, generate five distinct, high-quality AI image generation prompts for this product.
            The prompts should cover these styles:
            1. Professional studio photography
            2. Lifestyle setting
            3. Close-up detail
            4. Outdoor/Nature environment
            5. Creative/Artistic composition
            
            Return each prompt on a separate line, numbered 1-5.
            
            Description: $description
        """.trimIndent()

        val response = generateText(
            prompt = prompt,
            maxTokens = 512,
            temperature = 0.7
        )

        return response.split("\n")
            .map { it.trim() }
            .filter { it.isNotEmpty() && it.matches(Regex("^\\d+\\..*")) }
            .map { it.replaceFirst(Regex("^\\d+\\.\\s*"), "") }
            .filter { it.isNotEmpty() }
    }

    /**
     * Generate marketing copy for a product
     *
     * @param productName The product name
     * @param productDescription The product description
     * @param pdfGuidesCount Number of PDF guides available
     * @return JSON string containing the marketing copy
     */
    suspend fun generateMarketingCopy(
        productName: String,
        productDescription: String?,
        pdfGuidesCount: Int = 0
    ): String {
        val pdfGuidesInfo = if (pdfGuidesCount > 0) {
            "\nAdditional Context: This product has $pdfGuidesCount PDF guide(s) available, suggesting it may have technical specifications or detailed documentation."
        } else ""

        val prompt = """
            You are an expert marketing copywriter specializing in e-commerce product descriptions. 
            Create compelling, conversion-focused marketing copy for the following product.
            
            Product Name: $productName
            Product Description: ${productDescription ?: "No description provided"}$pdfGuidesInfo
            
            Your task is to generate a JSON object with the following fields:
            
            1. headline: A catchy, benefit-driven headline that grabs attention (max 60 characters)
            2. subheadline: A compelling subheadline that expands on the value proposition (max 120 characters)
            3. description: A persuasive product description highlighting what makes it special (2-3 sentences, max 300 characters)
            4. features: An array of 3-5 specific, tangible product features (e.g., "Premium Leather Construction", "Wireless Charging Compatible", "Water-Resistant Design"). Each feature should be concrete and descriptive (max 50 characters each)
            5. benefits: An array of 3-5 customer-focused benefits that explain the value (e.g., "Lasts for Years", "Saves You Time", "Enhances Your Lifestyle"). Focus on outcomes and emotional value (max 50 characters each)
            
            Important: 
            - Features describe WHAT the product has (specifications, materials, capabilities)
            - Benefits describe WHY it matters to the customer (value, outcomes, feelings)
            - Make features and benefits specific to this product, not generic
            - Use professional, persuasive language
            
            Return ONLY a valid JSON object with these exact keys, no extra text or markdown formatting.
        """.trimIndent()

        return generateText(
            prompt = prompt,
            maxTokens = 1024,
            temperature = 0.7
        )
    }


}
