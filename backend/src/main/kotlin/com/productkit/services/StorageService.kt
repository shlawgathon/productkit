package com.productkit.services

import com.productkit.utils.Config
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.net.URI

class StorageService {
    private val s3: S3Client? by lazy {
        if (Config.DO_SPACES_KEY != null && Config.DO_SPACES_SECRET != null && Config.DO_SPACES_ENDPOINT != null) {
            S3Client.builder()
                .endpointOverride(URI.create(Config.DO_SPACES_ENDPOINT))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(Config.DO_SPACES_KEY, Config.DO_SPACES_SECRET)
                ))
                .build()
        } else {
            null
        }
    }

    fun uploadFile(fileName: String, fileBytes: ByteArray, contentType: String): String {
        val client = s3 ?: throw IllegalStateException("Storage not configured")
        val bucket = Config.DO_SPACES_BUCKET ?: throw IllegalStateException("Bucket not configured")

        val request = PutObjectRequest.builder()
            .bucket(bucket)
            .key(fileName)
            .acl("public-read")
            .contentType(contentType)
            .build()

        client.putObject(request, RequestBody.fromBytes(fileBytes))

        // Construct URL
        // Note: This logic assumes a specific URL structure for DO Spaces. 
        // Adjust if using a custom domain or different provider.
        var fileUrl = "${Config.DO_SPACES_ENDPOINT!!.replace("https://", "https://${bucket}.")}/$fileName"
        
        // Handle trailing slash in endpoint if present, though the replace above might make it tricky.
        // A safer way for standard DO spaces: https://bucket.region.digitaloceanspaces.com/filename
        
        // Let's stick to the logic from UploadRoutes for consistency, but clean it up.
        if (Config.DO_SPACES_ENDPOINT.endsWith("/")) {
             // If endpoint is like https://nyc3.digitaloceanspaces.com/
             // and bucket is mybucket
             // we want https://mybucket.nyc3.digitaloceanspaces.com/filename
             // The replace logic above handles the subdomain injection.
             // But if endpoint has trailing slash, we might get double slash.
             // Let's just use the logic that was working.
             fileUrl = "${Config.DO_SPACES_ENDPOINT.replace("https://", "https://${bucket}.")}/$fileName"
             // Wait, the original code had:
             // fileUrl = "${Config.DO_SPACES_ENDPOINT.replace("https://", "https://${Config.DO_SPACES_BUCKET}.")}/$fileName"
             // if (Config.DO_SPACES_ENDPOINT.endsWith("/")) { fileUrl = "${Config.DO_SPACES_ENDPOINT}$fileName" } -> This looks wrong in original code if it overwrites the subdomain logic?
             // Actually, let's look at the original code again.
             
             /*
             fileUrl = "${Config.DO_SPACES_ENDPOINT.replace("https://", "https://${Config.DO_SPACES_BUCKET}.")}/$fileName"
             if (Config.DO_SPACES_ENDPOINT.endsWith("/")) {
                 fileUrl = "${Config.DO_SPACES_ENDPOINT}$fileName"
             }
             */
             // If endpoint ends with /, the second line overwrites the first. That implies the first line was ignored?
             // That seems like a bug in the original code if the endpoint has a trailing slash.
             // But I will trust the "replace" logic is what is intended for subdomain style.
             
             // Let's just use the replace logic and ensure no double slash.
             val baseUrl = Config.DO_SPACES_ENDPOINT.trimEnd('/')
             fileUrl = "${baseUrl.replace("https://", "https://${bucket}.")}/$fileName"
        }
        
        return fileUrl
    }
}
