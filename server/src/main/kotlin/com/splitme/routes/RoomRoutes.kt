package com.splitme.routes

import com.splitme.core.FinancialCalculator
import com.splitme.model.*
import com.splitme.repository.RoomRepository
import com.splitme.util.ShortCodeGenerator
import com.splitme.websocket.RoomConnectionPool
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.request.receiveNullable
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import java.util.UUID

fun Application.configureRoomRoutes(
    repository: RoomRepository,
    connectionPool: RoomConnectionPool
) {
    routing {
        route("/api/rooms") {
            post {
                val request = try {
                    call.receiveNullable<CreateRoomRequest>() ?: CreateRoomRequest()
                } catch (_: Exception) {
                    CreateRoomRequest()
                }

                val roomId = UUID.randomUUID().toString()
                var shortCode = ShortCodeGenerator.generate()
                while (repository.getRoomByCode(shortCode) != null) {
                    shortCode = ShortCodeGenerator.generate()
                }

                val title = request.title?.ifBlank { "SplitMe 聚會分帳" } ?: "SplitMe 聚會分帳"
                val members = if (!request.members.isNullOrEmpty()) {
                    request.members
                } else {
                    val hostName = request.hostName?.ifBlank { "主揪" } ?: "主揪"
                    listOf(
                        Member(
                            id = UUID.randomUUID().toString(),
                            name = hostName,
                            avatarColor = "#3B82F6",
                            isHost = true
                        )
                    )
                }

                val now = System.currentTimeMillis()
                val room = Room(
                    id = roomId,
                    title = title,
                    code = shortCode,
                    isLocked = false,
                    currency = request.currency ?: "TWD",
                    roundingMode = request.roundingMode ?: RoundingMode.NEAREST_INTEGER,
                    members = members,
                    items = request.items ?: emptyList(),
                    extraFees = request.extraFees ?: emptyList(),
                    paymentInfo = request.paymentInfo,
                    createdAt = now,
                    updatedAt = now
                )

                val created = repository.createRoom(room)
                call.respond(HttpStatusCode.Created, created)
            }

            get("{id}") {
                val idParam = call.parameters["id"]
                    ?: return@get call.respond(HttpStatusCode.BadRequest, ErrorResponse("Missing room id", "INVALID_ARGUMENT"))

                val room = repository.getRoom(idParam)
                    ?: repository.getRoomByCode(idParam)
                    ?: repository.getRoomByCode(idParam.uppercase())

                if (room != null) {
                    call.respond(HttpStatusCode.OK, room)
                } else {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Room not found: $idParam", "ROOM_NOT_FOUND"))
                }
            }

            put("{id}") {
                val idParam = call.parameters["id"]
                    ?: return@put call.respond(HttpStatusCode.BadRequest, ErrorResponse("Missing room id", "INVALID_ARGUMENT"))

                val existing = repository.getRoom(idParam)
                    ?: repository.getRoomByCode(idParam)
                    ?: repository.getRoomByCode(idParam.uppercase())
                    ?: return@put call.respond(HttpStatusCode.NotFound, ErrorResponse("Room not found: $idParam", "ROOM_NOT_FOUND"))

                if (existing.isLocked) {
                    return@put call.respond(HttpStatusCode.Forbidden, ErrorResponse("Room is locked for settlement", "ROOM_LOCKED"))
                }

                val body = call.receive<Room>()
                val target = body.copy(
                    id = existing.id,
                    code = existing.code,
                    createdAt = existing.createdAt,
                    updatedAt = System.currentTimeMillis()
                )

                val updated = repository.updateRoom(target)
                connectionPool.broadcast(existing.id, WsMessage.SyncState(updated, connectionPool.getActiveMemberIds(existing.id)))
                call.respond(HttpStatusCode.OK, updated)
            }

            post("{id}/lock") {
                val idParam = call.parameters["id"]
                    ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Missing room id", "INVALID_ARGUMENT"))

                val existing = repository.getRoom(idParam)
                    ?: repository.getRoomByCode(idParam)
                    ?: repository.getRoomByCode(idParam.uppercase())
                    ?: return@post call.respond(HttpStatusCode.NotFound, ErrorResponse("Room not found: $idParam", "ROOM_NOT_FOUND"))

                val lockRequest = try {
                    call.receiveNullable<LockRoomRequest>() ?: LockRoomRequest(isLocked = true)
                } catch (_: Exception) {
                    LockRoomRequest(isLocked = true)
                }

                repository.setRoomLock(existing.id, lockRequest.isLocked)
                val updated = repository.getRoom(existing.id) ?: existing.copy(isLocked = lockRequest.isLocked)
                connectionPool.broadcast(existing.id, WsMessage.SettlementLocked(lockRequest.isLocked, updated))
                call.respond(HttpStatusCode.OK, updated)
            }

            get("{id}/settlement") {
                val idParam = call.parameters["id"]
                    ?: return@get call.respond(HttpStatusCode.BadRequest, ErrorResponse("Missing room id", "INVALID_ARGUMENT"))

                val existing = repository.getRoom(idParam)
                    ?: repository.getRoomByCode(idParam)
                    ?: repository.getRoomByCode(idParam.uppercase())
                    ?: return@get call.respond(HttpStatusCode.NotFound, ErrorResponse("Room not found: $idParam", "ROOM_NOT_FOUND"))

                val settlement = FinancialCalculator.calculateSettlement(existing)
                call.respond(HttpStatusCode.OK, settlement)
            }
        }
    }
}
