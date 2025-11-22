package com.productkit.repositories

import com.productkit.db.Database
import com.productkit.models.UserSettings
import org.litote.kmongo.eq

class SettingsRepository {
    private val col = Database.db.getCollection<UserSettings>("settings")

    suspend fun get(userId: String): UserSettings? = col.findOne(UserSettings::userId eq userId)

    suspend fun upsert(settings: UserSettings): UserSettings {
        val existing = get(settings.userId)
        if (existing == null) col.insertOne(settings) else col.replaceOne(UserSettings::userId eq settings.userId, settings)
        return settings
    }
}
