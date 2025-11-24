package com.productkit.repositories

import com.productkit.db.Database
import com.productkit.models.AccessCode
import org.litote.kmongo.and
import org.litote.kmongo.combine
import org.litote.kmongo.eq
import org.litote.kmongo.setValue

class AccessCodeRepository {
    private val col = Database.db.getCollection<AccessCode>("access_codes")

    suspend fun create(code: AccessCode): AccessCode {
        col.insertOne(code)
        return code
    }

    suspend fun findByCode(code: String): AccessCode? {
        return col.findOne(AccessCode::code eq code)
    }

    suspend fun findAll(): List<AccessCode> {
        return col.find().toList()
    }

    suspend fun markAsUsed(codeId: String, userId: String): Boolean {
        val result =
                col.updateOne(
                        AccessCode::_id eq codeId,
                        combine(
                                setValue(AccessCode::usedBy, userId),
                                setValue(AccessCode::usedAt, System.currentTimeMillis())
                        )
                )
        return result.modifiedCount > 0
    }

    suspend fun ensureIndexes() {
        col.ensureUniqueIndex(AccessCode::code)
    }
}
