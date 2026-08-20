package com.splitme.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class HealthResponse(
    val status: String,
    val timestamp: Long = System.currentTimeMillis()
)

fun Application.configureRouting() {
    routing {
        get("/api/health") {
            call.respond(HttpStatusCode.OK, HealthResponse(status = "ok"))
        }

        staticResources("/", "static") {
            default("index.html")
        }
    }
}
