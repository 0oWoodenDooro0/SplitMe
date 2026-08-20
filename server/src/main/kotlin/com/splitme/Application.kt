package com.splitme

import com.splitme.plugins.*
import com.splitme.websocket.RoomConnectionPool
import io.ktor.server.application.*
import io.ktor.server.netty.*

fun main(args: Array<String>) = EngineMain.main(args)

fun Application.module() {
    configureSerialization()
    configureHTTP()
    configureSockets()
    val (roomRepository, scheduler) = configureDatabase()
    val connectionPool = RoomConnectionPool(roomRepository)
    configureRouting(roomRepository, connectionPool)
}

