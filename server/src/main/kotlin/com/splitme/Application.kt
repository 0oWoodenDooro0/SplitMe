package com.splitme

import com.splitme.plugins.*
import io.ktor.server.application.*
import io.ktor.server.netty.*

fun main(args: Array<String>) = EngineMain.main(args)

fun Application.module() {
    configureSerialization()
    configureHTTP()
    configureSockets()
    configureRouting()
}
