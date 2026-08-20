package com.splitme.repository

import com.splitme.model.Room

interface RoomRepository {
    suspend fun createRoom(room: Room): Room
    suspend fun getRoom(id: String): Room?
    suspend fun getRoomByCode(code: String): Room?
    suspend fun updateRoom(room: Room): Room
    suspend fun setRoomLock(id: String, isLocked: Boolean): Boolean
    suspend fun deleteRoom(id: String): Boolean
    suspend fun cleanExpiredRooms(olderThanMillis: Long): Int
    suspend fun listRooms(): List<Room>
}
