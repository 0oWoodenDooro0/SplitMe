package com.splitme.service

import com.splitme.db.DatabaseFactory
import com.splitme.model.Room
import com.splitme.repository.SqliteRoomRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class RoomCleanupSchedulerTest {

    private lateinit var databaseFactory: DatabaseFactory
    private lateinit var repository: SqliteRoomRepository
    private lateinit var testScope: CoroutineScope

    @BeforeEach
    fun setUp() {
        val uniqueDbName = "scheduler_db_${UUID.randomUUID().toString().replace("-", "")}"
        val jdbcUrl = "jdbc:sqlite:file:$uniqueDbName?mode=memory&cache=shared"
        databaseFactory = DatabaseFactory(jdbcUrl = jdbcUrl)
        databaseFactory.init()
        repository = SqliteRoomRepository(databaseFactory)
        testScope = CoroutineScope(Dispatchers.Default)
    }

    @AfterEach
    fun tearDown() {
        testScope.cancel()
        databaseFactory.close()
    }

    @Test
    fun `test scheduler periodically removes expired rooms`() = runBlocking {
        val now = System.currentTimeMillis()
        val expiredRoom = Room(
            id = "room-sched-exp",
            title = "Expired Room",
            code = "EXP999",
            updatedAt = now - 5000L
        )
        val activeRoom = Room(
            id = "room-sched-act",
            title = "Active Room",
            code = "ACT999",
            updatedAt = now
        )

        repository.createRoom(expiredRoom)
        repository.createRoom(activeRoom)

        val scheduler = RoomCleanupScheduler(
            repository = repository,
            checkIntervalMillis = 50L,
            ttlMillis = 1000L
        )

        scheduler.start(testScope)

        // Wait for scheduler to perform cleanup
        delay(200L)

        // Expired room should be removed, active room preserved
        assertNull(repository.getRoom("room-sched-exp"))
        assertNotNull(repository.getRoom("room-sched-act"))

        scheduler.stop()
        assertFalse(scheduler.isRunning())
    }

    @Test
    fun `test scheduler start and stop lifecycle`() = runBlocking {
        val scheduler = RoomCleanupScheduler(
            repository = repository,
            checkIntervalMillis = 1000L,
            ttlMillis = 5000L
        )

        assertFalse(scheduler.isRunning())
        scheduler.start(testScope)
        assertTrue(scheduler.isRunning())

        scheduler.stop()
        assertFalse(scheduler.isRunning())
    }
}
