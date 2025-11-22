package com.productkit.repositories

import com.productkit.db.Database
import com.productkit.models.Product
import kotlinx.coroutines.flow.toList
import org.litote.kmongo.eq

class ProductRepository {
    private val col = Database.db.getCollection<Product>("products")

    suspend fun create(product: Product): Product {
        col.insertOne(product)
        return product
    }

    suspend fun update(product: Product): Product {
        col.replaceOne(Product::_id eq product._id, product)
        return product
    }

    suspend fun delete(productId: String): Boolean = col.deleteOne(Product::_id eq productId).deletedCount > 0

    suspend fun findById(id: String): Product? = col.findOne(Product::_id eq id)

    suspend fun findByUser(userId: String): List<Product> = col.find(Product::userId eq userId).toList()
}
