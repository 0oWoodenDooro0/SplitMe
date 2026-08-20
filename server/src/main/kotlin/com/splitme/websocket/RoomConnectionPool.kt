package com.splitme.websocket

import com.splitme.model.Item
import com.splitme.model.Room
import com.splitme.model.SplitShare
import com.splitme.model.SplitType
import com.splitme.model.WsMessage
import com.splitme.repository.RoomRepository
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import io.ktor.websocket.send
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import java.util.concurrent.ConcurrentHashMap

class RoomConnectionPool(
    private val repository: RoomRepository
) {
    private val logger = LoggerFactory.getLogger(RoomConnectionPool::class.java)

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    data class RoomSession(
        val session: WebSocketServerSession,
        var memberId: String? = null,
        var memberName: String? = null
    ) {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other !is RoomSession) return false
            return session == other.session
        }

        override fun hashCode(): Int = session.hashCode()
    }

    private val roomSessions = ConcurrentHashMap<String, MutableSet<RoomSession>>()

    suspend fun resolveRoom(idOrCode: String): Room? {
        return repository.getRoom(idOrCode)
            ?: repository.getRoomByCode(idOrCode)
            ?: repository.getRoomByCode(idOrCode.uppercase())
    }

    fun registerSession(roomId: String, session: WebSocketServerSession): RoomSession {
        val set = roomSessions.computeIfAbsent(roomId) { ConcurrentHashMap.newKeySet() }
        val roomSession = RoomSession(session)
        set.add(roomSession)
        return roomSession
    }

    suspend fun unregisterSession(roomId: String, session: WebSocketServerSession) {
        val set = roomSessions[roomId] ?: return
        val removed = set.firstOrNull { it.session == session }
        if (removed != null) {
            set.remove(removed)
            if (removed.memberId != null) {
                // Notify remaining participants about presence change if desired
                val activeIds = getActiveMemberIds(roomId)
                broadcast(
                    roomId = roomId,
                    message = WsMessage.MemberJoined(
                        memberId = removed.memberId!!,
                        memberName = removed.memberName,
                        activeMemberIds = activeIds
                    )
                )
            }
        }
    }

    fun getActiveMemberIds(roomId: String): List<String> {
        val set = roomSessions[roomId] ?: return emptyList()
        return set.mapNotNull { it.memberId }.distinct()
    }

    suspend fun sendTo(session: WebSocketServerSession, message: WsMessage) {
        try {
            val text = json.encodeToString<WsMessage>(message)
            session.send(Frame.Text(text))
        } catch (e: Exception) {
            logger.warn("Failed to send message to session: ${e.message}")
        }
    }

    suspend fun broadcast(roomId: String, message: WsMessage, excludeSession: WebSocketServerSession? = null) {
        val set = roomSessions[roomId] ?: return
        val text = json.encodeToString<WsMessage>(message)
        for (roomSession in set) {
            if (excludeSession == null || roomSession.session != excludeSession) {
                try {
                    roomSession.session.send(Frame.Text(text))
                } catch (e: Exception) {
                    logger.warn("Failed to broadcast message to session: ${e.message}")
                }
            }
        }
    }

    suspend fun handleMessage(roomId: String, session: WebSocketServerSession, frame: Frame.Text) {
        val text = frame.readText()
        val message = try {
            json.decodeFromString<WsMessage>(text)
        } catch (e: Exception) {
            logger.warn("Failed to parse incoming WebSocket message: $text", e)
            sendTo(session, WsMessage.Error("Invalid message format: ${e.message}", "INVALID_FORMAT"))
            return
        }

        val roomSession = roomSessions[roomId]?.firstOrNull { it.session == session }

        when (message) {
            is WsMessage.JoinRoom -> {
                if (roomSession != null) {
                    roomSession.memberId = message.memberId
                    roomSession.memberName = message.memberName
                }
                val activeIds = getActiveMemberIds(roomId)
                val event = WsMessage.MemberJoined(
                    memberId = message.memberId,
                    memberName = message.memberName,
                    activeMemberIds = activeIds
                )
                broadcast(roomId, event)
            }

            is WsMessage.ToggleItemCheck -> {
                val currentRoom = repository.getRoom(roomId)
                if (currentRoom == null) {
                    sendTo(session, WsMessage.Error("Room not found: $roomId", "ROOM_NOT_FOUND"))
                    return
                }

                if (currentRoom.isLocked) {
                    sendTo(session, WsMessage.Error("Room is locked for settlement", "ROOM_LOCKED"))
                    return
                }

                val item = currentRoom.items.find { it.id == message.itemId }
                if (item == null) {
                    sendTo(session, WsMessage.Error("Item not found: ${message.itemId}", "ITEM_NOT_FOUND"))
                    return
                }

                val updatedSplits = if (message.isChecked) {
                    if (item.splits.any { it.memberId == message.memberId }) {
                        item.splits
                    } else {
                        item.splits + SplitShare(memberId = message.memberId, splitType = SplitType.EQUAL, value = 1.0)
                    }
                } else {
                    item.splits.filter { it.memberId != message.memberId }
                }

                val updatedItems = currentRoom.items.map {
                    if (it.id == message.itemId) it.copy(splits = updatedSplits) else it
                }

                val updatedRoom = currentRoom.copy(
                    items = updatedItems,
                    updatedAt = System.currentTimeMillis()
                )

                repository.updateRoom(updatedRoom)
                val event = WsMessage.ItemCheckToggled(
                    itemId = message.itemId,
                    memberId = message.memberId,
                    isChecked = message.isChecked,
                    room = updatedRoom
                )
                broadcast(roomId, event)
            }

            is WsMessage.UpdateRoom -> {
                val currentRoom = repository.getRoom(roomId)
                if (currentRoom == null) {
                    sendTo(session, WsMessage.Error("Room not found: $roomId", "ROOM_NOT_FOUND"))
                    return
                }

                if (currentRoom.isLocked) {
                    sendTo(session, WsMessage.Error("Room is locked for settlement", "ROOM_LOCKED"))
                    return
                }

                val targetRoom = message.room.copy(id = roomId, updatedAt = System.currentTimeMillis())
                val updatedRoom = repository.updateRoom(targetRoom)
                broadcast(roomId, WsMessage.SyncState(updatedRoom, getActiveMemberIds(roomId)))
            }

            is WsMessage.LockSettlement -> {
                val currentRoom = repository.getRoom(roomId)
                if (currentRoom == null) {
                    sendTo(session, WsMessage.Error("Room not found: $roomId", "ROOM_NOT_FOUND"))
                    return
                }

                repository.setRoomLock(roomId, message.isLocked)
                val updatedRoom = repository.getRoom(roomId) ?: currentRoom.copy(isLocked = message.isLocked)
                broadcast(roomId, WsMessage.SettlementLocked(message.isLocked, updatedRoom))
            }

            is WsMessage.RequestSync -> {
                val currentRoom = repository.getRoom(roomId)
                if (currentRoom != null) {
                    sendTo(session, WsMessage.SyncState(currentRoom, getActiveMemberIds(roomId)))
                } else {
                    sendTo(session, WsMessage.Error("Room not found: $roomId", "ROOM_NOT_FOUND"))
                }
            }

            else -> {
                // Server-sent events received from client, ignore or log
                logger.debug("Received event type from client: {}", message)
            }
        }
    }
}
