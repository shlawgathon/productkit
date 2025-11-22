package com.productkit.routes

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.registerHealthRoutes() {
    route("/") {
        get("health") {
            call.respond(mapOf("status" to "ok"))
        }
    }
}
