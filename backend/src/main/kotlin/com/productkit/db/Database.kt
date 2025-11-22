package com.productkit.db

import com.productkit.utils.Config
import com.mongodb.ConnectionString
import com.mongodb.MongoClientSettings
import kotlinx.coroutines.runBlocking
import org.litote.kmongo.coroutine.CoroutineClient
import org.litote.kmongo.coroutine.CoroutineDatabase
import org.litote.kmongo.coroutine.coroutine
import org.litote.kmongo.reactivestreams.KMongo

object Database {
    private val client: CoroutineClient by lazy {
        val settings = MongoClientSettings.builder()
            .applyConnectionString(ConnectionString(Config.MONGODB_URI))
            .build()
        KMongo.createClient(settings).coroutine
    }

    val db: CoroutineDatabase by lazy { client.getDatabase("productkit") }
}
