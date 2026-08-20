package com.splitme.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed class WsMessage {
    // Client -> Server Commands
    @Serializable
    @SerialName("JOIN_ROOM")
    data class JoinRoom(
        val memberId: String,
        val memberName: String? = null
    ) : WsMessage()

    @Serializable
    @SerialName("TOGGLE_ITEM_CHECK")
    data class ToggleItemCheck(
        val itemId: String,
        val memberId: String,
        val isChecked: Boolean
    ) : WsMessage()

    @Serializable
    @SerialName("UPDATE_ROOM")
    data class UpdateRoom(
        val room: Room
    ) : WsMessage()

    @Serializable
    @SerialName("LOCK_SETTLEMENT")
    data class LockSettlement(
        val isLocked: Boolean = true
    ) : WsMessage()

    @Serializable
    @SerialName("REQUEST_SYNC")
    data class RequestSync(
        val dummy: String? = null
    ) : WsMessage()

    // Server -> Client Events
    @Serializable
    @SerialName("SYNC_STATE")
    data class SyncState(
        val room: Room,
        val activeMemberIds: List<String> = emptyList()
    ) : WsMessage()

    @Serializable
    @SerialName("MEMBER_JOINED")
    data class MemberJoined(
        val memberId: String,
        val memberName: String? = null,
        val activeMemberIds: List<String> = emptyList()
    ) : WsMessage()

    @Serializable
    @SerialName("ITEM_CHECK_TOGGLED")
    data class ItemCheckToggled(
        val itemId: String,
        val memberId: String,
        val isChecked: Boolean,
        val room: Room
    ) : WsMessage()

    @Serializable
    @SerialName("SETTLEMENT_LOCKED")
    data class SettlementLocked(
        val isLocked: Boolean,
        val room: Room
    ) : WsMessage()

    @Serializable
    @SerialName("ERROR")
    data class Error(
        val message: String,
        val code: String? = null
    ) : WsMessage()
}
