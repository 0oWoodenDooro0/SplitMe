package com.splitme.routes

import com.splitme.model.WsMessage
import com.splitme.repository.RoomRepository
import com.splitme.websocket.RoomConnectionPool
import io.ktor.server.application.Application
import io.ktor.server.routing.routing
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import kotlinx.coroutines.channels.consumeEach
import org.slf4j.LoggerFactory

fun Application.configureRoomWebSocket(
    repository: RoomRepository,
    connectionPool: RoomConnectionPool
) {
    val logger = LoggerFactory.getLogger("RoomWebSocket")

    routing {
        webSocket("/ws/rooms/{id}") {
            val idParam = call.parameters["id"]
            if (idParam.isNullOrBlank()) {
                close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Missing room id"))
                return@webSocket
            }

            val room = connectionPool.resolveRoom(idParam)
            if (room == null) {
                close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Room not found: $idParam"))
                return@webSocket
            }

            val canonicalRoomId = room.id
            connectionPool.registerSession(canonicalRoomId, this)

            try {
                // Send initial state snapshot to connected client
                val activeMemberIds = connectionPool.getActiveMemberIds(canonicalRoomId)
                connectionPool.sendTo(this, WsMessage.SyncState(room, activeMemberIds))

                incoming.consumeEach { frame ->
                    if (frame is Frame.Text) {
                        connectionPool.handleMessage(canonicalRoomId, this, frame)
                    }
                }
            } catch (e: Exception) {
                logger.debug("WebSocket connection error for room $canonicalRoomId: ${e.message}")
            } finally {
                connectionPool.unregisterSession(canonicalRoomId, this)
            }
        }
    }
}
