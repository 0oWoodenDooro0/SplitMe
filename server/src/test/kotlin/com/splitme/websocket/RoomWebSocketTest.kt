package com.splitme.websocket

import com.splitme.db.DatabaseFactory
import com.splitme.model.*
import com.splitme.plugins.configureSerialization
import com.splitme.plugins.configureSockets
import com.splitme.repository.SqliteRoomRepository
import com.splitme.routes.configureRoomRoutes
import com.splitme.routes.configureRoomWebSocket
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.client.plugins.websocket.webSocket
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.testApplication
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class RoomWebSocketTest {

    private lateinit var databaseFactory: DatabaseFactory
    private lateinit var repository: SqliteRoomRepository
    private lateinit var connectionPool: RoomConnectionPool

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

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

    private fun withTestWsApp(block: suspend (client: io.ktor.client.HttpClient) -> Unit) = testApplication {
        application {
            configureSerialization()
            configureSockets()
            configureRoomRoutes(repository, connectionPool)
            configureRoomWebSocket(repository, connectionPool)
        }
        val client = createClient {
            install(WebSockets)
            install(ContentNegotiation) {
                json(json)
            }
        }
        runBlocking {
            block(client)
        }
    }

    @Test
    fun `test websocket connection receives initial sync state event`() = withTestWsApp { client ->
        val room = Room(
            id = "ws-room-1",
            title = "Party Room",
            code = "PARTY1",
            members = listOf(Member(id = "m1", name = "Host", avatarColor = "#FF0000", isHost = true))
        )
        repository.createRoom(room)

        client.webSocket("/ws/rooms/ws-room-1") {
            val initialFrame = incoming.receive() as Frame.Text
            val message = json.decodeFromString<WsMessage>(initialFrame.readText())
            assertIs<WsMessage.SyncState>(message)
            assertEquals("ws-room-1", message.room.id)
            assertEquals("Party Room", message.room.title)
        }
    }

    @Test
    fun `test join room event updates presence and broadcasts member joined`() = withTestWsApp { client ->
        val room = Room(
            id = "ws-room-join",
            title = "Join Test Room",
            code = "JOIN01",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true),
                Member(id = "m2", name = "Bob", avatarColor = "#00FF00", isHost = false)
            )
        )
        repository.createRoom(room)

        client.webSocket("/ws/rooms/ws-room-join") {
            // Receive initial SYNC_STATE
            val initialFrame = incoming.receive() as Frame.Text
            assertIs<WsMessage.SyncState>(json.decodeFromString<WsMessage>(initialFrame.readText()))

            // Send JOIN_ROOM
            val joinCmd = WsMessage.JoinRoom(memberId = "m2", memberName = "Bob")
            send(Frame.Text(json.encodeToString<WsMessage>(joinCmd)))

            // Expect MEMBER_JOINED broadcast
            val memberJoinedFrame = incoming.receive() as Frame.Text
            val joinedMsg = json.decodeFromString<WsMessage>(memberJoinedFrame.readText())
            assertIs<WsMessage.MemberJoined>(joinedMsg)
            assertEquals("m2", joinedMsg.memberId)
            assertEquals("Bob", joinedMsg.memberName)
            assertTrue(joinedMsg.activeMemberIds.contains("m2"))
        }
    }

    @Test
    fun `test join room with new member name persists member and broadcasts sync state`() = withTestWsApp { client ->
        val room = Room(
            id = "ws-room-new-join",
            title = "New Member Join Room",
            code = "JOIN02",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true)
            )
        )
        repository.createRoom(room)

        client.webSocket("/ws/rooms/ws-room-new-join") {
            // Receive initial SYNC_STATE
            val initialFrame = incoming.receive() as Frame.Text
            assertIs<WsMessage.SyncState>(json.decodeFromString<WsMessage>(initialFrame.readText()))

            // Send JOIN_ROOM with new member "Charlie"
            val joinCmd = WsMessage.JoinRoom(memberId = "m-charlie", memberName = "Charlie")
            send(Frame.Text(json.encodeToString<WsMessage>(joinCmd)))

            // Expect SYNC_STATE broadcast containing updated room with Charlie
            val syncFrame = incoming.receive() as Frame.Text
            val syncMsg = json.decodeFromString<WsMessage>(syncFrame.readText())
            assertIs<WsMessage.SyncState>(syncMsg)
            assertTrue(syncMsg.room.members.any { it.id == "m-charlie" && it.name == "Charlie" })
            assertTrue(syncMsg.activeMemberIds.contains("m-charlie"))

            // Verify in repository
            val savedRoom = repository.getRoom("ws-room-new-join")
            assertNotNull(savedRoom)
            assertTrue(savedRoom.members.any { it.id == "m-charlie" && it.name == "Charlie" })
        }
    }


    @Test
    fun `test toggle item check adds split share and broadcasts updated room state`() = withTestWsApp { client ->
        val member1 = Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true)
        val member2 = Member(id = "m2", name = "Bob", avatarColor = "#00FF00", isHost = false)
        val item1 = Item(
            id = "i1",
            name = "Pizza",
            price = 500.0,
            paidByMemberId = "m1",
            splits = listOf(SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0))
        )
        val room = Room(
            id = "ws-room-toggle",
            title = "Toggle Test",
            code = "TOG001",
            members = listOf(member1, member2),
            items = listOf(item1)
        )
        repository.createRoom(room)

        client.webSocket("/ws/rooms/ws-room-toggle") {
            // Receive initial SYNC_STATE
            incoming.receive()

            // Toggle item check on for member m2
            val toggleCmd = WsMessage.ToggleItemCheck(itemId = "i1", memberId = "m2", isChecked = true)
            send(Frame.Text(json.encodeToString<WsMessage>(toggleCmd)))

            // Expect ITEM_CHECK_TOGGLED broadcast
            val toggledFrame = incoming.receive() as Frame.Text
            val toggledMsg = json.decodeFromString<WsMessage>(toggledFrame.readText())
            assertIs<WsMessage.ItemCheckToggled>(toggledMsg)
            assertEquals("i1", toggledMsg.itemId)
            assertEquals("m2", toggledMsg.memberId)
            assertTrue(toggledMsg.isChecked)

            val updatedSplits = toggledMsg.room.items.find { it.id == "i1" }?.splits
            assertNotNull(updatedSplits)
            assertEquals(2, updatedSplits.size)
            assertTrue(updatedSplits.any { it.memberId == "m2" })
        }
    }

    @Test
    fun `test toggle item check removes split share when unchecking`() = withTestWsApp { client ->
        val member1 = Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true)
        val member2 = Member(id = "m2", name = "Bob", avatarColor = "#00FF00", isHost = false)
        val item1 = Item(
            id = "i1",
            name = "Salad",
            price = 200.0,
            paidByMemberId = "m1",
            splits = listOf(
                SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0),
                SplitShare(memberId = "m2", splitType = SplitType.EQUAL, value = 1.0)
            )
        )
        val room = Room(
            id = "ws-room-uncheck",
            title = "Uncheck Test",
            code = "UNC001",
            members = listOf(member1, member2),
            items = listOf(item1)
        )
        repository.createRoom(room)

        client.webSocket("/ws/rooms/ws-room-uncheck") {
            // Consume initial SYNC_STATE
            incoming.receive()

            // Uncheck m2
            val uncheckCmd = WsMessage.ToggleItemCheck(itemId = "i1", memberId = "m2", isChecked = false)
            send(Frame.Text(json.encodeToString<WsMessage>(uncheckCmd)))

            val toggledFrame = incoming.receive() as Frame.Text
            val toggledMsg = json.decodeFromString<WsMessage>(toggledFrame.readText())
            assertIs<WsMessage.ItemCheckToggled>(toggledMsg)
            assertEquals("i1", toggledMsg.itemId)
            assertEquals("m2", toggledMsg.memberId)
            assertFalse(toggledMsg.isChecked)

            val updatedSplits = toggledMsg.room.items.find { it.id == "i1" }?.splits
            assertNotNull(updatedSplits)
            assertEquals(1, updatedSplits.size)
            assertFalse(updatedSplits.any { it.memberId == "m2" })
        }
    }

    @Test
    fun `test lock settlement broadcasts settlement locked event to all connected clients`() = withTestWsApp { client ->
        val room = Room(
            id = "ws-room-lock",
            title = "Lock Broadcast Test",
            code = "LCKB01",
            isLocked = false
        )
        repository.createRoom(room)

        client.webSocket("/ws/rooms/ws-room-lock") {
            incoming.receive() // Consume initial SYNC_STATE

            // Send LOCK_SETTLEMENT
            val lockCmd = WsMessage.LockSettlement(isLocked = true)
            send(Frame.Text(json.encodeToString<WsMessage>(lockCmd)))

            val frame = incoming.receive() as Frame.Text
            val msg = json.decodeFromString<WsMessage>(frame.readText())
            assertIs<WsMessage.SettlementLocked>(msg)
            assertTrue(msg.isLocked)
            assertTrue(msg.room.isLocked)
        }
    }

    @Test
    fun `test toggle item check on locked room returns error event and rejects mutation`() = withTestWsApp { client ->
        val item1 = Item(
            id = "i1",
            name = "Steak",
            price = 800.0,
            paidByMemberId = "m1",
            splits = emptyList()
        )
        val room = Room(
            id = "ws-room-locked-mutate",
            title = "Locked Room",
            code = "LCKM01",
            isLocked = true,
            items = listOf(item1)
        )
        repository.createRoom(room)

        client.webSocket("/ws/rooms/ws-room-locked-mutate") {
            incoming.receive() // Consume initial SYNC_STATE

            // Attempt to toggle item check on locked room
            val toggleCmd = WsMessage.ToggleItemCheck(itemId = "i1", memberId = "m2", isChecked = true)
            send(Frame.Text(json.encodeToString<WsMessage>(toggleCmd)))

            val frame = incoming.receive() as Frame.Text
            val msg = json.decodeFromString<WsMessage>(frame.readText())
            assertIs<WsMessage.Error>(msg)
            assertEquals("ROOM_LOCKED", msg.code)

            // Verify database room remains unmodified
            val currentRoom = repository.getRoom("ws-room-locked-mutate")
            assertNotNull(currentRoom)
            assertTrue(currentRoom.items[0].splits.isEmpty())
        }
    }

    @Test
    fun `test request sync sends current room state to client`() = withTestWsApp { client ->
        val room = Room(
            id = "ws-room-sync-req",
            title = "Sync Test",
            code = "SYN001"
        )
        repository.createRoom(room)

        client.webSocket("/ws/rooms/ws-room-sync-req") {
            incoming.receive() // Consume initial SYNC_STATE

            val req = WsMessage.RequestSync()
            send(Frame.Text(json.encodeToString<WsMessage>(req)))

            val frame = incoming.receive() as Frame.Text
            val msg = json.decodeFromString<WsMessage>(frame.readText())
            assertIs<WsMessage.SyncState>(msg)
            assertEquals("ws-room-sync-req", msg.room.id)
        }
    }

    @Test
    fun `test multiple rooms have isolated websocket sessions`() = withTestWsApp { client ->
        val roomA = Room(id = "room-A", title = "Room A", code = "ROOMA1")
        val roomB = Room(id = "room-B", title = "Room B", code = "ROOMB1")
        repository.createRoom(roomA)
        repository.createRoom(roomB)

        client.webSocket("/ws/rooms/room-A") {
            val frameA = incoming.receive() as Frame.Text
            val msgA = json.decodeFromString<WsMessage>(frameA.readText())
            assertIs<WsMessage.SyncState>(msgA)
            assertEquals("room-A", msgA.room.id)
        }

        client.webSocket("/ws/rooms/ROOMB1") {
            val frameB = incoming.receive() as Frame.Text
            val msgB = json.decodeFromString<WsMessage>(frameB.readText())
            assertIs<WsMessage.SyncState>(msgB)
            assertEquals("room-B", msgB.room.id)
        }
    }
}
