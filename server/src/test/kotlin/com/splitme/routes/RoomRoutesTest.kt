package com.splitme.routes

import com.splitme.db.DatabaseFactory
import com.splitme.model.*
import com.splitme.plugins.configureSerialization
import com.splitme.plugins.configureSockets
import com.splitme.repository.SqliteRoomRepository
import com.splitme.websocket.RoomConnectionPool
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.testApplication
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class RoomRoutesTest {

    private lateinit var databaseFactory: DatabaseFactory
    private lateinit var repository: SqliteRoomRepository
    private lateinit var connectionPool: RoomConnectionPool

    @BeforeEach
    fun setUp() {
        val uniqueDbName = "test_db_${UUID.randomUUID().toString().replace("-", "")}"
        val jdbcUrl = "jdbc:sqlite:file:$uniqueDbName?mode=memory&cache=shared"
        databaseFactory = DatabaseFactory(jdbcUrl = jdbcUrl)
        databaseFactory.init()
        repository = SqliteRoomRepository(databaseFactory)
        connectionPool = RoomConnectionPool(repository)
    }

    @AfterEach
    fun tearDown() {
        databaseFactory.close()
    }

    private fun withTestApp(block: suspend (client: io.ktor.client.HttpClient) -> Unit) = testApplication {
        application {
            configureSerialization()
            configureSockets()
            configureRoomRoutes(repository, connectionPool)
            configureRoomWebSocket(repository, connectionPool)
        }
        val client = createClient {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true; isLenient = true; encodeDefaults = true })
            }
        }
        runBlocking {
            block(client)
        }
    }

    @Test
    fun `test create room with default parameters generates UUID, 6-char code, and default host member`() = withTestApp { client ->
        val response = client.post("/api/rooms") {
            contentType(ContentType.Application.Json)
            setBody(CreateRoomRequest())
        }

        assertEquals(HttpStatusCode.Created, response.status)
        val room = response.body<Room>()
        assertNotNull(room.id)
        assertTrue(room.id.isNotEmpty())
        assertEquals(6, room.code.length)
        assertFalse(room.isLocked)
        assertEquals("TWD", room.currency)
        assertEquals(1, room.members.size)
        assertTrue(room.members[0].isHost)
        assertEquals("主揪", room.members[0].name)
    }

    @Test
    fun `test create room with custom title, currency, and custom members`() = withTestApp { client ->
        val customMembers = listOf(
            Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true),
            Member(id = "m2", name = "Bob", avatarColor = "#00FF00", isHost = false)
        )
        val customItems = listOf(
            Item(
                id = "i1",
                name = "Hotpot",
                price = 1000.0,
                paidByMemberId = "m1",
                splits = listOf(SplitShare(memberId = "m1"), SplitShare(memberId = "m2"))
            )
        )

        val request = CreateRoomRequest(
            title = "Friday Hotpot",
            currency = "JPY",
            roundingMode = RoundingMode.ROUND_UP,
            members = customMembers,
            items = customItems
        )

        val response = client.post("/api/rooms") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }

        assertEquals(HttpStatusCode.Created, response.status)
        val created = response.body<Room>()
        assertEquals("Friday Hotpot", created.title)
        assertEquals("JPY", created.currency)
        assertEquals(RoundingMode.ROUND_UP, created.roundingMode)
        assertEquals(2, created.members.size)
        assertEquals(1, created.items.size)
    }

    @Test
    fun `test get room by UUID returns 200 and room snapshot`() = withTestApp { client ->
        val room = Room(
            id = "room-uuid-123",
            title = "BBQ Party",
            code = "BBQ777",
            members = listOf(Member(id = "m1", name = "Chef", avatarColor = "#112233", isHost = true))
        )
        repository.createRoom(room)

        val response = client.get("/api/rooms/room-uuid-123")
        assertEquals(HttpStatusCode.OK, response.status)
        val fetched = response.body<Room>()
        assertEquals("room-uuid-123", fetched.id)
        assertEquals("BBQ Party", fetched.title)
        assertEquals("BBQ777", fetched.code)
    }

    @Test
    fun `test get room by 6-character short code returns 200 and room snapshot`() = withTestApp { client ->
        val room = Room(
            id = "room-code-lookup-1",
            title = "Sushi Lunch",
            code = "SUSHI1",
            members = listOf(Member(id = "m1", name = "Host", avatarColor = "#334455", isHost = true))
        )
        repository.createRoom(room)

        val response = client.get("/api/rooms/SUSHI1")
        assertEquals(HttpStatusCode.OK, response.status)
        val fetched = response.body<Room>()
        assertEquals("room-code-lookup-1", fetched.id)
        assertEquals("Sushi Lunch", fetched.title)

        // Case insensitive lookup
        val lowerResponse = client.get("/api/rooms/sushi1")
        assertEquals(HttpStatusCode.OK, lowerResponse.status)
    }

    @Test
    fun `test get non existent room returns 404 Not Found`() = withTestApp { client ->
        val response = client.get("/api/rooms/NON_EXISTENT_ID")
        assertEquals(HttpStatusCode.NotFound, response.status)
        val error = response.body<ErrorResponse>()
        assertTrue(error.error.contains("not found", ignoreCase = true))
    }

    @Test
    fun `test update room modifies title, members, items, fees and returns updated room`() = withTestApp { client ->
        val initial = Room(
            id = "room-to-update",
            title = "Initial Title",
            code = "INIT01",
            members = listOf(Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true))
        )
        repository.createRoom(initial)

        val updated = initial.copy(
            title = "Modified Title",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true),
                Member(id = "m2", name = "Bob", avatarColor = "#00FF00", isHost = false)
            ),
            items = listOf(
                Item(
                    id = "item-1",
                    name = "Pizza",
                    price = 500.0,
                    paidByMemberId = "m1",
                    splits = listOf(SplitShare(memberId = "m1"), SplitShare(memberId = "m2"))
                )
            )
        )

        val response = client.put("/api/rooms/room-to-update") {
            contentType(ContentType.Application.Json)
            setBody(updated)
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val result = response.body<Room>()
        assertEquals("Modified Title", result.title)
        assertEquals(2, result.members.size)
        assertEquals(1, result.items.size)
    }

    @Test
    fun `test update room when locked returns 403 Forbidden`() = withTestApp { client ->
        val lockedRoom = Room(
            id = "room-locked-test",
            title = "Locked Room",
            code = "LOCK99",
            isLocked = true
        )
        repository.createRoom(lockedRoom)

        val modified = lockedRoom.copy(title = "Should Not Update")
        val response = client.put("/api/rooms/room-locked-test") {
            contentType(ContentType.Application.Json)
            setBody(modified)
        }

        assertEquals(HttpStatusCode.Forbidden, response.status)
        val error = response.body<ErrorResponse>()
        assertEquals("ROOM_LOCKED", error.code)
    }

    @Test
    fun `test lock and unlock room toggles isLocked state and returns updated room`() = withTestApp { client ->
        val room = Room(
            id = "room-toggle-lock",
            title = "Lock Room",
            code = "LCK888",
            isLocked = false
        )
        repository.createRoom(room)

        // Lock room
        val lockResponse = client.post("/api/rooms/room-toggle-lock/lock") {
            contentType(ContentType.Application.Json)
            setBody(LockRoomRequest(isLocked = true))
        }
        assertEquals(HttpStatusCode.OK, lockResponse.status)
        val locked = lockResponse.body<Room>()
        assertTrue(locked.isLocked)

        // Unlock room
        val unlockResponse = client.post("/api/rooms/room-toggle-lock/lock") {
            contentType(ContentType.Application.Json)
            setBody(LockRoomRequest(isLocked = false))
        }
        assertEquals(HttpStatusCode.OK, unlockResponse.status)
        val unlocked = unlockResponse.body<Room>()
        assertFalse(unlocked.isLocked)
    }

    @Test
    fun `test get room settlement calculates balances and transfer routes`() = withTestApp { client ->
        val member1 = Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true)
        val member2 = Member(id = "m2", name = "Bob", avatarColor = "#00FF00", isHost = false)
        val item1 = Item(
            id = "i1",
            name = "Dinner",
            price = 600.0,
            paidByMemberId = "m1",
            splits = listOf(
                SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0),
                SplitShare(memberId = "m2", splitType = SplitType.EQUAL, value = 1.0)
            )
        )
        val room = Room(
            id = "room-calc-test",
            title = "Settlement Test",
            code = "CALC01",
            members = listOf(member1, member2),
            items = listOf(item1)
        )
        repository.createRoom(room)

        val response = client.get("/api/rooms/room-calc-test/settlement")
        assertEquals(HttpStatusCode.OK, response.status)
        val settlement = response.body<SettlementResult>()
        assertEquals(600.0, settlement.totalItemAmount)
        assertEquals(600.0, settlement.grandTotal)
        assertTrue(settlement.isBalanced)
        assertEquals(1, settlement.transfers.size)
        assertEquals("m2", settlement.transfers[0].fromMemberId)
        assertEquals("m1", settlement.transfers[0].toMemberId)
        assertEquals(300.0, settlement.transfers[0].amount)
    }

    @Test
    fun `test get settlement for non existent room returns 404`() = withTestApp { client ->
        val response = client.get("/api/rooms/UNKNOWN_ID/settlement")
        assertEquals(HttpStatusCode.NotFound, response.status)
    }
}
