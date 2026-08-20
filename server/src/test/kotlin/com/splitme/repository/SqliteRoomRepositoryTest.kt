package com.splitme.repository

import com.splitme.db.DatabaseFactory
import com.splitme.db.ExtraFeesTable
import com.splitme.db.ItemsTable
import com.splitme.db.MembersTable
import com.splitme.db.RoomsTable
import com.splitme.db.SplitsTable
import com.splitme.model.ExtraFee
import com.splitme.model.FeeAllocationMethod
import com.splitme.model.FeeType
import com.splitme.model.Item
import com.splitme.model.Member
import com.splitme.model.PaymentInfo
import com.splitme.model.Room
import com.splitme.model.RoundingMode
import com.splitme.model.SplitShare
import com.splitme.model.SplitType
import kotlinx.coroutines.runBlocking
import org.jetbrains.exposed.sql.selectAll
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class SqliteRoomRepositoryTest {

    private lateinit var databaseFactory: DatabaseFactory
    private lateinit var repository: SqliteRoomRepository

    @BeforeEach
    fun setUp() {
        val uniqueDbName = "test_db_${UUID.randomUUID().toString().replace("-", "")}"
        val jdbcUrl = "jdbc:sqlite:file:$uniqueDbName?mode=memory&cache=shared"
        databaseFactory = DatabaseFactory(jdbcUrl = jdbcUrl)
        databaseFactory.init()
        repository = SqliteRoomRepository(databaseFactory)
    }

    @AfterEach
    fun tearDown() {
        databaseFactory.close()
    }

    @Test
    fun `test create and get room with complete hierarchy`() = runBlocking {
        val member1 = Member(id = "m1", name = "Alice", avatarColor = "#FF5733", isHost = true)
        val member2 = Member(id = "m2", name = "Bob", avatarColor = "#33FF57", isHost = false)
        val member3 = Member(id = "m3", name = "Charlie", avatarColor = "#3357FF", isHost = false)

        val item1 = Item(
            id = "i1",
            name = "Pizza",
            price = 600.0,
            paidByMemberId = "m1",
            splits = listOf(
                SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0),
                SplitShare(memberId = "m2", splitType = SplitType.EQUAL, value = 1.0),
                SplitShare(memberId = "m3", splitType = SplitType.EQUAL, value = 1.0)
            )
        )

        val item2 = Item(
            id = "i2",
            name = "Wine",
            price = 300.0,
            paidByMemberId = "m2",
            splits = listOf(
                SplitShare(memberId = "m1", splitType = SplitType.WEIGHTED, value = 1.5),
                SplitShare(memberId = "m2", splitType = SplitType.EXACT_AMOUNT, value = 100.0)
            )
        )

        val fee1 = ExtraFee(
            id = "f1",
            name = "Service Fee",
            feeType = FeeType.PERCENTAGE,
            rate = 0.10,
            amount = 0.0,
            allocationMethod = FeeAllocationMethod.PROPORTIONAL_SUBTOTAL,
            targetMemberIds = emptyList()
        )

        val fee2 = ExtraFee(
            id = "f2",
            name = "Delivery",
            feeType = FeeType.FIXED_AMOUNT,
            rate = 0.0,
            amount = 60.0,
            allocationMethod = FeeAllocationMethod.SELECTED_MEMBERS,
            targetMemberIds = listOf("m1", "m2")
        )

        val paymentInfo = PaymentInfo(
            bankCode = "822",
            bankAccount = "123456789012",
            linePayUrl = "https://line.me/pay/test",
            jkoPayUrl = "https://jkos.com/pay/test",
            customQrUrl = "https://splitme.app/qr/test.png",
            note = "Please transfer before Friday"
        )

        val room = Room(
            id = "room-123",
            title = "Weekend Feast",
            code = "FEAST1",
            isLocked = false,
            currency = "TWD",
            roundingMode = RoundingMode.NEAREST_INTEGER,
            members = listOf(member1, member2, member3),
            items = listOf(item1, item2),
            extraFees = listOf(fee1, fee2),
            paymentInfo = paymentInfo,
            createdAt = 1700000000000L,
            updatedAt = 1700000000000L
        )

        val created = repository.createRoom(room)
        assertEquals("room-123", created.id)

        val retrieved = repository.getRoom("room-123")
        assertNotNull(retrieved)
        assertEquals("room-123", retrieved.id)
        assertEquals("Weekend Feast", retrieved.title)
        assertEquals("FEAST1", retrieved.code)
        assertFalse(retrieved.isLocked)
        assertEquals("TWD", retrieved.currency)
        assertEquals(RoundingMode.NEAREST_INTEGER, retrieved.roundingMode)
        assertEquals(1700000000000L, retrieved.createdAt)
        assertEquals(1700000000000L, retrieved.updatedAt)

        // Verify Payment Info
        assertNotNull(retrieved.paymentInfo)
        assertEquals("822", retrieved.paymentInfo?.bankCode)
        assertEquals("123456789012", retrieved.paymentInfo?.bankAccount)
        assertEquals("https://line.me/pay/test", retrieved.paymentInfo?.linePayUrl)
        assertEquals("https://jkos.com/pay/test", retrieved.paymentInfo?.jkoPayUrl)
        assertEquals("https://splitme.app/qr/test.png", retrieved.paymentInfo?.customQrUrl)
        assertEquals("Please transfer before Friday", retrieved.paymentInfo?.note)

        // Verify Members
        assertEquals(3, retrieved.members.size)
        val m1 = retrieved.members.find { it.id == "m1" }
        assertNotNull(m1)
        assertEquals("Alice", m1.name)
        assertEquals("#FF5733", m1.avatarColor)
        assertTrue(m1.isHost)

        val m2 = retrieved.members.find { it.id == "m2" }
        assertNotNull(m2)
        assertEquals("Bob", m2.name)
        assertFalse(m2.isHost)

        // Verify Items & Splits
        assertEquals(2, retrieved.items.size)
        val i1 = retrieved.items.find { it.id == "i1" }
        assertNotNull(i1)
        assertEquals("Pizza", i1.name)
        assertEquals(600.0, i1.price)
        assertEquals("m1", i1.paidByMemberId)
        assertEquals(3, i1.splits.size)

        val i2 = retrieved.items.find { it.id == "i2" }
        assertNotNull(i2)
        assertEquals("Wine", i2.name)
        assertEquals(300.0, i2.price)
        assertEquals("m2", i2.paidByMemberId)
        assertEquals(2, i2.splits.size)
        val i2s1 = i2.splits.find { it.memberId == "m1" }
        assertNotNull(i2s1)
        assertEquals(SplitType.WEIGHTED, i2s1.splitType)
        assertEquals(1.5, i2s1.value)

        // Verify Extra Fees
        assertEquals(2, retrieved.extraFees.size)
        val f1 = retrieved.extraFees.find { it.id == "f1" }
        assertNotNull(f1)
        assertEquals("Service Fee", f1.name)
        assertEquals(FeeType.PERCENTAGE, f1.feeType)
        assertEquals(0.10, f1.rate)
        assertEquals(FeeAllocationMethod.PROPORTIONAL_SUBTOTAL, f1.allocationMethod)

        val f2 = retrieved.extraFees.find { it.id == "f2" }
        assertNotNull(f2)
        assertEquals("Delivery", f2.name)
        assertEquals(FeeType.FIXED_AMOUNT, f2.feeType)
        assertEquals(60.0, f2.amount)
        assertEquals(FeeAllocationMethod.SELECTED_MEMBERS, f2.allocationMethod)
        assertEquals(listOf("m1", "m2"), f2.targetMemberIds)
    }

    @Test
    fun `test get room by 6-character short code`() = runBlocking {
        val room = Room(
            id = "room-code-test",
            title = "Code Test Room",
            code = "ABC999",
            members = listOf(Member(id = "m1", name = "Host", avatarColor = "#111111", isHost = true))
        )
        repository.createRoom(room)

        val found = repository.getRoomByCode("ABC999")
        assertNotNull(found)
        assertEquals("room-code-test", found.id)
        assertEquals("Code Test Room", found.title)

        val notFound = repository.getRoomByCode("NONEXIST")
        assertNull(notFound)
    }

    @Test
    fun `test get non existent room returns null`() = runBlocking {
        val nonExistent = repository.getRoom("non-existent-id")
        assertNull(nonExistent)
    }

    @Test
    fun `test update room modifies metadata and child entities`() = runBlocking {
        val initialRoom = Room(
            id = "room-update-test",
            title = "Initial Title",
            code = "UPD111",
            isLocked = false,
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true),
                Member(id = "m2", name = "Bob", avatarColor = "#00FF00", isHost = false)
            ),
            items = listOf(
                Item(
                    id = "i1",
                    name = "Burger",
                    price = 150.0,
                    paidByMemberId = "m1",
                    splits = listOf(SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0))
                )
            ),
            updatedAt = 1000L
        )
        repository.createRoom(initialRoom)

        val updatedRoom = initialRoom.copy(
            title = "Updated Title",
            roundingMode = RoundingMode.ROUND_UP,
            members = listOf(
                Member(id = "m1", name = "Alice Updated", avatarColor = "#FF0000", isHost = true),
                Member(id = "m3", name = "Charlie New", avatarColor = "#0000FF", isHost = false)
            ),
            items = listOf(
                Item(
                    id = "i1",
                    name = "Double Burger",
                    price = 220.0,
                    paidByMemberId = "m1",
                    splits = listOf(
                        SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m3", splitType = SplitType.EQUAL, value = 1.0)
                    )
                ),
                Item(
                    id = "i2",
                    name = "Fries",
                    price = 60.0,
                    paidByMemberId = "m3",
                    splits = listOf(SplitShare(memberId = "m3", splitType = SplitType.EQUAL, value = 1.0))
                )
            ),
            extraFees = listOf(
                ExtraFee(
                    id = "f1",
                    name = "Tip",
                    feeType = FeeType.FIXED_AMOUNT,
                    amount = 30.0,
                    allocationMethod = FeeAllocationMethod.EQUAL_MEMBERS
                )
            ),
            paymentInfo = PaymentInfo(bankCode = "004", bankAccount = "987654321"),
            updatedAt = 2000L
        )

        val saved = repository.updateRoom(updatedRoom)
        assertEquals("Updated Title", saved.title)

        val reloaded = repository.getRoom("room-update-test")
        assertNotNull(reloaded)
        assertEquals("Updated Title", reloaded.title)
        assertEquals(RoundingMode.ROUND_UP, reloaded.roundingMode)
        assertEquals(2, reloaded.members.size)
        assertTrue(reloaded.members.any { it.id == "m3" && it.name == "Charlie New" })
        assertFalse(reloaded.members.any { it.id == "m2" }) // Bob removed

        assertEquals(2, reloaded.items.size)
        val i1 = reloaded.items.find { it.id == "i1" }
        assertNotNull(i1)
        assertEquals("Double Burger", i1.name)
        assertEquals(220.0, i1.price)
        assertEquals(2, i1.splits.size)

        assertEquals(1, reloaded.extraFees.size)
        assertEquals("Tip", reloaded.extraFees[0].name)
        assertEquals("004", reloaded.paymentInfo?.bankCode)
        assertEquals("987654321", reloaded.paymentInfo?.bankAccount)
    }

    @Test
    fun `test set room lock`() = runBlocking {
        val room = Room(
            id = "room-lock-test",
            title = "Lock Test",
            code = "LCK123",
            isLocked = false
        )
        repository.createRoom(room)

        val lockedResult = repository.setRoomLock("room-lock-test", true)
        assertTrue(lockedResult)
        assertTrue(repository.getRoom("room-lock-test")?.isLocked == true)

        val unlockedResult = repository.setRoomLock("room-lock-test", false)
        assertTrue(unlockedResult)
        assertFalse(repository.getRoom("room-lock-test")?.isLocked == true)
    }

    @Test
    fun `test delete room cascades to all entities`() = runBlocking {
        val room = Room(
            id = "room-cascade-test",
            title = "Cascade Delete Test",
            code = "CAS123",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true)
            ),
            items = listOf(
                Item(
                    id = "i1",
                    name = "Steak",
                    price = 500.0,
                    paidByMemberId = "m1",
                    splits = listOf(SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0))
                )
            ),
            extraFees = listOf(
                ExtraFee(
                    id = "f1",
                    name = "Corkage",
                    feeType = FeeType.FIXED_AMOUNT,
                    amount = 200.0,
                    allocationMethod = FeeAllocationMethod.EQUAL_MEMBERS
                )
            )
        )
        repository.createRoom(room)

        val deleted = repository.deleteRoom("room-cascade-test")
        assertTrue(deleted)
        assertNull(repository.getRoom("room-cascade-test"))

        // Verify child tables directly via DB query
        databaseFactory.dbQuery {
            val membersCount = MembersTable.selectAll().where { MembersTable.roomId eq "room-cascade-test" }.count()
            val itemsCount = ItemsTable.selectAll().where { ItemsTable.roomId eq "room-cascade-test" }.count()
            val splitsCount = SplitsTable.selectAll().where { SplitsTable.itemId eq "i1" }.count()
            val feesCount = ExtraFeesTable.selectAll().where { ExtraFeesTable.roomId eq "room-cascade-test" }.count()

            assertEquals(0L, membersCount)
            assertEquals(0L, itemsCount)
            assertEquals(0L, splitsCount)
            assertEquals(0L, feesCount)
        }
    }

    @Test
    fun `test clean expired rooms older than TTL threshold`() = runBlocking {
        val now = System.currentTimeMillis()
        val sevenDaysMillis = 7 * 24 * 60 * 60 * 1000L

        val activeRoom = Room(
            id = "room-active",
            title = "Active Room (1 day old)",
            code = "ACT001",
            updatedAt = now - (1 * 24 * 60 * 60 * 1000L)
        )

        val expiredRoom1 = Room(
            id = "room-exp-1",
            title = "Expired Room (8 days old)",
            code = "EXP001",
            updatedAt = now - (8 * 24 * 60 * 60 * 1000L)
        )

        val expiredRoom2 = Room(
            id = "room-exp-2",
            title = "Expired Room (14 days old)",
            code = "EXP002",
            updatedAt = now - (14 * 24 * 60 * 60 * 1000L)
        )

        repository.createRoom(activeRoom)
        repository.createRoom(expiredRoom1)
        repository.createRoom(expiredRoom2)

        val threshold = now - sevenDaysMillis
        val cleanedCount = repository.cleanExpiredRooms(threshold)

        assertEquals(2, cleanedCount)
        assertNotNull(repository.getRoom("room-active"))
        assertNull(repository.getRoom("room-exp-1"))
        assertNull(repository.getRoom("room-exp-2"))
    }

    @Test
    fun `test list rooms returns all rooms`() = runBlocking {
        val r1 = Room(id = "r1", title = "Room 1", code = "R001")
        val r2 = Room(id = "r2", title = "Room 2", code = "R002")

        repository.createRoom(r1)
        repository.createRoom(r2)

        val list = repository.listRooms()
        assertEquals(2, list.size)
        assertTrue(list.any { it.id == "r1" })
        assertTrue(list.any { it.id == "r2" })
    }
}
