package com.productkit.routes

import com.productkit.utils.Config
import com.productkit.utils.Config.DO_SPACES_ENDPOINT
import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.net.URI
import java.util.UUID

fun Route.registerUploadRoutes() {
    authenticate("auth-jwt") {
        post("/api/upload") {
            println("Upload request received")
            val multipart = call.receiveMultipart()
            var fileUrl: String? = null

            println("Config Check: ENDPOINT=${Config.DO_SPACES_ENDPOINT}, BUCKET=${Config.DO_SPACES_BUCKET}, KEY_PRESENT=${Config.DO_SPACES_KEY != null}")

            multipart.forEachPart { part ->
                if (part is PartData.FileItem) {
                    val fileName = "${UUID.randomUUID()}-${part.originalFileName}"
                    println("Processing file: $fileName")
                    val fileBytes = part.streamProvider().readBytes()

                    if (Config.DO_SPACES_KEY != null && Config.DO_SPACES_SECRET != null && Config.DO_SPACES_ENDPOINT != null && Config.DO_SPACES_BUCKET != null) {
                        // Upload to DigitalOcean Spaces
                        try {
                            println("Initializing S3 Client...")
                            val s3 = S3Client.builder()
                                .endpointOverride(URI.create(Config.DO_SPACES_ENDPOINT))
                                .region(Region.US_EAST_1) // DO Spaces uses us-east-1 signature
                                .credentialsProvider(StaticCredentialsProvider.create(
                                    AwsBasicCredentials.create(Config.DO_SPACES_KEY, Config.DO_SPACES_SECRET)
                                ))
                                .build()

                            println("S3 Client initialized. Uploading...")
                            val request = PutObjectRequest.builder()
                                .bucket(Config.DO_SPACES_BUCKET)
                                .key(fileName)
                                .acl("public-read")
                                .contentType(part.contentType?.toString() ?: "application/octet-stream")
                                .build()

                            s3.putObject(request, RequestBody.fromBytes(fileBytes))
                            println("Upload successful.")

                            // Let's construct it safely.
                            fileUrl = "${Config.DO_SPACES_ENDPOINT}/$fileName"
                            // Fix double slash if endpoint has trailing slash
                            if (Config.DO_SPACES_ENDPOINT.endsWith("/")) {
                                fileUrl = "${Config.DO_SPACES_ENDPOINT}$fileName"
                            }
                            println("File URL: $fileUrl")
                        } catch (e: Exception) {
                            println("Exception during upload: ${e.message}")
                            e.printStackTrace()
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Upload failed: ${e.message}"))
                            return@forEachPart
                        }
                    } else {
                        println("Storage config missing.")
                         call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Storage not configured"))
                         return@forEachPart
                    }
                }
                part.dispose()
            }

            if (fileUrl != null) {
                call.respond(mapOf("url" to fileUrl))
            } else {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "No file uploaded"))
            }
        }
    }
}
