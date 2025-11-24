package com.productkit.scripts

import com.productkit.models.AccessCode
import com.productkit.repositories.AccessCodeRepository
import java.util.UUID
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val repo = AccessCodeRepository()
    repo.ensureIndexes()

    val codeStr = UUID.randomUUID().toString().substring(0, 8).uppercase()
    val expiresAt =
            System.currentTimeMillis() + TimeUnit.DAYS.toMillis(365) // Long expiry for seed code

    val accessCode = AccessCode(code = codeStr, createdBy = "SYSTEM", expiresAt = expiresAt)

    repo.create(accessCode)
    println("Initial Access Code Generated: $codeStr")
}
