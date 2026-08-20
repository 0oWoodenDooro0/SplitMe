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
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import org.jetbrains.exposed.sql.SqlExpressionBuilder.less
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update

class SqliteRoomRepository(
    private val dbFactory: DatabaseFactory
) : RoomRepository {

    override suspend fun createRoom(room: Room): Room = dbFactory.dbQuery {
        RoomsTable.insert {
            it[id] = room.id
            it[title] = room.title
            it[code] = room.code
            it[isLocked] = room.isLocked
            it[currency] = room.currency
            it[roundingMode] = room.roundingMode.name
            it[paymentBankCode] = room.paymentInfo?.bankCode
            it[paymentBankAccount] = room.paymentInfo?.bankAccount
            it[paymentLinePayUrl] = room.paymentInfo?.linePayUrl
            it[paymentJkoPayUrl] = room.paymentInfo?.jkoPayUrl
            it[paymentCustomQrUrl] = room.paymentInfo?.customQrUrl
            it[paymentNote] = room.paymentInfo?.note
            it[createdAt] = room.createdAt
            it[updatedAt] = room.updatedAt
        }

        for (member in room.members) {
            MembersTable.insert {
                it[id] = member.id
                it[roomId] = room.id
                it[name] = member.name
                it[avatarColor] = member.avatarColor
                it[isHost] = member.isHost
            }
        }

        for (item in room.items) {
            ItemsTable.insert {
                it[id] = item.id
                it[roomId] = room.id
                it[name] = item.name
                it[price] = item.price
                it[paidByMemberId] = item.paidByMemberId
            }
            for (split in item.splits) {
                SplitsTable.insert {
                    it[itemId] = item.id
                    it[memberId] = split.memberId
                    it[splitType] = split.splitType.name
                    it[value] = split.value
                }
            }
        }

        for (fee in room.extraFees) {
            ExtraFeesTable.insert {
                it[id] = fee.id
                it[roomId] = room.id
                it[name] = fee.name
                it[feeType] = fee.feeType.name
                it[rate] = fee.rate
                it[amount] = fee.amount
                it[allocationMethod] = fee.allocationMethod.name
                it[targetMemberIds] = Json.encodeToString(fee.targetMemberIds)
            }
        }

        room
    }

    override suspend fun getRoom(id: String): Room? = dbFactory.dbQuery {
        val row = RoomsTable.selectAll().where { RoomsTable.id eq id }.singleOrNull() ?: return@dbQuery null
        extractRoom(row)
    }

    override suspend fun getRoomByCode(code: String): Room? = dbFactory.dbQuery {
        val row = RoomsTable.selectAll().where { RoomsTable.code eq code }.singleOrNull() ?: return@dbQuery null
        extractRoom(row)
    }

    override suspend fun updateRoom(room: Room): Room = dbFactory.dbQuery {
        RoomsTable.update({ RoomsTable.id eq room.id }) {
            it[title] = room.title
            it[code] = room.code
            it[isLocked] = room.isLocked
            it[currency] = room.currency
            it[roundingMode] = room.roundingMode.name
            it[paymentBankCode] = room.paymentInfo?.bankCode
            it[paymentBankAccount] = room.paymentInfo?.bankAccount
            it[paymentLinePayUrl] = room.paymentInfo?.linePayUrl
            it[paymentJkoPayUrl] = room.paymentInfo?.jkoPayUrl
            it[paymentCustomQrUrl] = room.paymentInfo?.customQrUrl
            it[paymentNote] = room.paymentInfo?.note
            it[updatedAt] = room.updatedAt
        }

        // Sync Members
        MembersTable.deleteWhere { MembersTable.roomId eq room.id }
        for (member in room.members) {
            MembersTable.insert {
                it[id] = member.id
                it[roomId] = room.id
                it[name] = member.name
                it[avatarColor] = member.avatarColor
                it[isHost] = member.isHost
            }
        }

        // Sync Items & Splits
        val oldItemIds = ItemsTable.select(ItemsTable.id).where { ItemsTable.roomId eq room.id }.map { it[ItemsTable.id] }
        if (oldItemIds.isNotEmpty()) {
            SplitsTable.deleteWhere { SplitsTable.itemId inList oldItemIds }
        }
        ItemsTable.deleteWhere { ItemsTable.roomId eq room.id }

        for (item in room.items) {
            ItemsTable.insert {
                it[id] = item.id
                it[roomId] = room.id
                it[name] = item.name
                it[price] = item.price
                it[paidByMemberId] = item.paidByMemberId
            }
            for (split in item.splits) {
                SplitsTable.insert {
                    it[itemId] = item.id
                    it[memberId] = split.memberId
                    it[splitType] = split.splitType.name
                    it[value] = split.value
                }
            }
        }

        // Sync Extra Fees
        ExtraFeesTable.deleteWhere { ExtraFeesTable.roomId eq room.id }
        for (fee in room.extraFees) {
            ExtraFeesTable.insert {
                it[id] = fee.id
                it[roomId] = room.id
                it[name] = fee.name
                it[feeType] = fee.feeType.name
                it[rate] = fee.rate
                it[amount] = fee.amount
                it[allocationMethod] = fee.allocationMethod.name
                it[targetMemberIds] = Json.encodeToString(fee.targetMemberIds)
            }
        }

        room
    }

    override suspend fun setRoomLock(id: String, isLocked: Boolean): Boolean = dbFactory.dbQuery {
        val count = RoomsTable.update({ RoomsTable.id eq id }) {
            it[RoomsTable.isLocked] = isLocked
            it[RoomsTable.updatedAt] = System.currentTimeMillis()
        }
        count > 0
    }

    override suspend fun deleteRoom(id: String): Boolean = dbFactory.dbQuery {
        val itemIds = ItemsTable.select(ItemsTable.id).where { ItemsTable.roomId eq id }.map { it[ItemsTable.id] }
        if (itemIds.isNotEmpty()) {
            SplitsTable.deleteWhere { SplitsTable.itemId inList itemIds }
        }
        ItemsTable.deleteWhere { ItemsTable.roomId eq id }
        MembersTable.deleteWhere { MembersTable.roomId eq id }
        ExtraFeesTable.deleteWhere { ExtraFeesTable.roomId eq id }
        val count = RoomsTable.deleteWhere { RoomsTable.id eq id }
        count > 0
    }

    override suspend fun cleanExpiredRooms(olderThanMillis: Long): Int = dbFactory.dbQuery {
        val expiredRoomIds = RoomsTable.select(RoomsTable.id)
            .where { RoomsTable.updatedAt less olderThanMillis }
            .map { it[RoomsTable.id] }

        if (expiredRoomIds.isEmpty()) {
            return@dbQuery 0
        }

        val expiredItemIds = ItemsTable.select(ItemsTable.id)
            .where { ItemsTable.roomId inList expiredRoomIds }
            .map { it[ItemsTable.id] }

        if (expiredItemIds.isNotEmpty()) {
            SplitsTable.deleteWhere { SplitsTable.itemId inList expiredItemIds }
        }
        ItemsTable.deleteWhere { ItemsTable.roomId inList expiredRoomIds }
        MembersTable.deleteWhere { MembersTable.roomId inList expiredRoomIds }
        ExtraFeesTable.deleteWhere { ExtraFeesTable.roomId inList expiredRoomIds }
        RoomsTable.deleteWhere { RoomsTable.id inList expiredRoomIds }
    }

    override suspend fun listRooms(): List<Room> = dbFactory.dbQuery {
        RoomsTable.selectAll().map { extractRoom(it) }
    }

    private fun extractRoom(roomRow: ResultRow): Room {
        val roomId = roomRow[RoomsTable.id]
        val members = MembersTable.selectAll().where { MembersTable.roomId eq roomId }.map {
            Member(
                id = it[MembersTable.id],
                name = it[MembersTable.name],
                avatarColor = it[MembersTable.avatarColor],
                isHost = it[MembersTable.isHost]
            )
        }
        val items = ItemsTable.selectAll().where { ItemsTable.roomId eq roomId }.map { itemRow ->
            val itemId = itemRow[ItemsTable.id]
            val splits = SplitsTable.selectAll().where { SplitsTable.itemId eq itemId }.map { splitRow ->
                SplitShare(
                    memberId = splitRow[SplitsTable.memberId],
                    splitType = SplitType.valueOf(splitRow[SplitsTable.splitType]),
                    value = splitRow[SplitsTable.value]
                )
            }
            Item(
                id = itemId,
                name = itemRow[ItemsTable.name],
                price = itemRow[ItemsTable.price],
                paidByMemberId = itemRow[ItemsTable.paidByMemberId],
                splits = splits
            )
        }
        val extraFees = ExtraFeesTable.selectAll().where { ExtraFeesTable.roomId eq roomId }.map { feeRow ->
            val targetIds = try {
                Json.decodeFromString<List<String>>(feeRow[ExtraFeesTable.targetMemberIds])
            } catch (_: Exception) {
                emptyList()
            }
            ExtraFee(
                id = feeRow[ExtraFeesTable.id],
                name = feeRow[ExtraFeesTable.name],
                feeType = FeeType.valueOf(feeRow[ExtraFeesTable.feeType]),
                rate = feeRow[ExtraFeesTable.rate],
                amount = feeRow[ExtraFeesTable.amount],
                allocationMethod = FeeAllocationMethod.valueOf(feeRow[ExtraFeesTable.allocationMethod]),
                targetMemberIds = targetIds
            )
        }

        val hasPaymentInfo = roomRow[RoomsTable.paymentBankCode] != null ||
            roomRow[RoomsTable.paymentBankAccount] != null ||
            roomRow[RoomsTable.paymentLinePayUrl] != null ||
            roomRow[RoomsTable.paymentJkoPayUrl] != null ||
            roomRow[RoomsTable.paymentCustomQrUrl] != null ||
            roomRow[RoomsTable.paymentNote] != null

        val paymentInfo = if (hasPaymentInfo) {
            PaymentInfo(
                bankCode = roomRow[RoomsTable.paymentBankCode],
                bankAccount = roomRow[RoomsTable.paymentBankAccount],
                linePayUrl = roomRow[RoomsTable.paymentLinePayUrl],
                jkoPayUrl = roomRow[RoomsTable.paymentJkoPayUrl],
                customQrUrl = roomRow[RoomsTable.paymentCustomQrUrl],
                note = roomRow[RoomsTable.paymentNote]
            )
        } else null

        return Room(
            id = roomId,
            title = roomRow[RoomsTable.title],
            code = roomRow[RoomsTable.code],
            isLocked = roomRow[RoomsTable.isLocked],
            currency = roomRow[RoomsTable.currency],
            roundingMode = RoundingMode.valueOf(roomRow[RoomsTable.roundingMode]),
            members = members,
            items = items,
            extraFees = extraFees,
            paymentInfo = paymentInfo,
            createdAt = roomRow[RoomsTable.createdAt],
            updatedAt = roomRow[RoomsTable.updatedAt]
        )
    }
}
