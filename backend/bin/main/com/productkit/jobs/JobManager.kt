package com.productkit.jobs

import com.productkit.models.ImageData
import com.productkit.models.Product
import com.productkit.models.ProductStatus
import com.productkit.repositories.ProductRepository
import com.productkit.services.FalService
import com.productkit.services.NvidiaService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

data class GenerationRequest(
    val assetTypes: List<String>,
    val count: Map<String, Int>,
    val style: String? = null
)

data class GenerationJobStatus(
    val jobId: String,
    val productId: String,
    var status: String,
    var progress: Int,
    var generatedAssets: ImageData? = null,
    var generated3dAssets: String? = null
)

object JobManager {
    private val scope = CoroutineScope(Dispatchers.Default)
    private val jobs = ConcurrentHashMap<String, GenerationJobStatus>()
    private val tasks = ConcurrentHashMap<String, Job>()

    private val productRepo = ProductRepository()
    private val fal = FalService()
    private val nvidia = NvidiaService()

    fun getStatus(jobId: String): GenerationJobStatus? = jobs[jobId]

    fun enqueueAssetsGeneration(productId: String, req: GenerationRequest): String {
        val jobId = UUID.randomUUID().toString()
        val status = GenerationJobStatus(jobId, productId, status = "QUEUED", progress = 0)
        jobs[jobId] = status

        val job = scope.launch {
            try {
                status.status = "RUNNING"
                status.progress = 5
                val product = productRepo.findById(productId) ?: run {
                    status.status = "ERROR"; return@launch
                }

                var imageData: ImageData? = null
                if ("hero" in req.assetTypes || "lifestyle" in req.assetTypes || "detail" in req.assetTypes) {
                    val heroCount = req.count["hero"] ?: 5
                    val baseImage = product.originalImages.firstOrNull()
                    if (baseImage != null) {
                        val images = fal.generateProductImages(productId, baseImage, type = "hero", count = heroCount)
                        imageData = images
                    }
                    status.progress = 40
                }

                var assets3d: String? = null
                if ("360" in req.assetTypes) {
                    val baseImage = product.originalImages.firstOrNull()
                    if (baseImage != null) {
                        val modelUrl = nvidia.generate3DModel(baseImage)
                       assets3d = modelUrl
                    }
                    status.progress = 70
                }

                // Update product minimal state
                val updated: Product = product.copy(status = ProductStatus.COMPLETED, updatedAt = System.currentTimeMillis())
                productRepo.update(updated)

                status.generatedAssets = imageData
                status.generated3dAssets = assets3d
                status.progress = 100
                status.status = "COMPLETED"
            } catch (e: Exception) {
                status.status = "ERROR"
            }
        }
        tasks[jobId] = job
        return jobId
    }
}
