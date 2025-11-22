package com.productkit.repositories

import com.productkit.db.Database
import com.productkit.models.User
import kotlinx.coroutines.flow.toList
import org.litote.kmongo.eq

class UserRepository {
    private val col = Database.db.getCollection<User>("users")

    suspend fun create(user: User): User {
        col.insertOne(user)
        return user
    }

    suspend fun findByEmail(email: String): User? = col.findOne(User::email eq email)

    suspend fun findById(id: String): User? = col.findOne(User::_id eq id)

    suspend fun update(user: User): Boolean {
        val result = col.replaceOne(User::_id eq user._id, user)
        return result.modifiedCount > 0
    }

    suspend fun ensureIndexes() {
        // Unique index on email
        col.ensureUniqueIndex(User::email)
    }
}
