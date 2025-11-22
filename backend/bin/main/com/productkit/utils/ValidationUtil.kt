package com.productkit.utils

object ValidationUtil {
    fun isValidEmail(email: String) = email.contains("@") && email.length in 5..254
    fun sanitize(input: String?): String? = input?.replace("<", "&lt;")?.replace(">", "&gt;")
}
