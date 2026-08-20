package com.splitme.db

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table

object RoomsTable : Table("rooms") {
    val id = varchar("id", 64)
    val title = varchar("title", 255)
    val code = varchar("code", 16).index()
    val isLocked = bool("is_locked").default(false)
    val currency = varchar("currency", 16).default("TWD")
    val roundingMode = varchar("rounding_mode", 32)
    val paymentBankCode = varchar("payment_bank_code", 32).nullable()
    val paymentBankAccount = varchar("payment_bank_account", 64).nullable()
    val paymentLinePayUrl = text("payment_line_pay_url").nullable()
    val paymentJkoPayUrl = text("payment_jko_pay_url").nullable()
    val paymentCustomQrUrl = text("payment_custom_qr_url").nullable()
    val paymentNote = text("payment_note").nullable()
    val createdAt = long("created_at")
    val updatedAt = long("updated_at").index()

    override val primaryKey = PrimaryKey(id)
}

object MembersTable : Table("members") {
    val id = varchar("id", 64)
    val roomId = varchar("room_id", 64).references(RoomsTable.id, onDelete = ReferenceOption.CASCADE).index()
    val name = varchar("name", 255)
    val avatarColor = varchar("avatar_color", 32)
    val isHost = bool("is_host").default(false)

    override val primaryKey = PrimaryKey(id)
}

object ItemsTable : Table("items") {
    val id = varchar("id", 64)
    val roomId = varchar("room_id", 64).references(RoomsTable.id, onDelete = ReferenceOption.CASCADE).index()
    val name = varchar("name", 255)
    val price = double("price")
    val paidByMemberId = varchar("paid_by_member_id", 64)

    override val primaryKey = PrimaryKey(id)
}

object SplitsTable : Table("splits") {
    val id = integer("id").autoIncrement()
    val itemId = varchar("item_id", 64).references(ItemsTable.id, onDelete = ReferenceOption.CASCADE).index()
    val memberId = varchar("member_id", 64)
    val splitType = varchar("split_type", 32)
    val value = double("value")

    override val primaryKey = PrimaryKey(id)
}

object ExtraFeesTable : Table("extra_fees") {
    val id = varchar("id", 64)
    val roomId = varchar("room_id", 64).references(RoomsTable.id, onDelete = ReferenceOption.CASCADE).index()
    val name = varchar("name", 255)
    val feeType = varchar("fee_type", 32)
    val rate = double("rate").default(0.0)
    val amount = double("amount").default(0.0)
    val allocationMethod = varchar("allocation_method", 32)
    val targetMemberIds = text("target_member_ids").default("[]")

    override val primaryKey = PrimaryKey(id)
}
