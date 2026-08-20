package com.splitme.plugins

import com.splitme.repository.RoomRepository
import com.splitme.routes.configureRoomRoutes
import com.splitme.routes.configureRoomWebSocket
import com.splitme.websocket.RoomConnectionPool
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

fun Application.configureRouting(
    repository: RoomRepository? = null,
    connectionPool: RoomConnectionPool? = null
) {
    if (repository != null && connectionPool != null) {
        configureRoomRoutes(repository, connectionPool)
        configureRoomWebSocket(repository, connectionPool)
    }

    routing {
        get("/api/health") {
            call.respond(HttpStatusCode.OK, HealthResponse(status = "ok"))
        }

        staticResources("/", "static") {
            default("index.html")
        }
    }
}

