package com.splitme.plugins

import com.splitme.db.DatabaseFactory
import com.splitme.repository.RoomRepository
import com.splitme.repository.SqliteRoomRepository
import com.splitme.service.RoomCleanupScheduler
import io.ktor.server.application.*

fun Application.configureDatabase(): Pair<RoomRepository, RoomCleanupScheduler> {
    val databaseFactory = DatabaseFactory()
    databaseFactory.init()

    val roomRepository = SqliteRoomRepository(databaseFactory)
    val scheduler = RoomCleanupScheduler(roomRepository)
    scheduler.start(this)

    monitor.subscribe(ApplicationStopped) {
        scheduler.stop()
        databaseFactory.close()
    }

    return Pair(roomRepository, scheduler)
}
