package com.splitme.model

import kotlinx.serialization.Serializable

@Serializable
data class CreateRoomRequest(
    val title: String? = null,
    val hostName: String? = null,
    val currency: String? = "TWD",
    val roundingMode: RoundingMode? = RoundingMode.NEAREST_INTEGER,
    val members: List<Member>? = null,
    val items: List<Item>? = null,
    val extraFees: List<ExtraFee>? = null,
    val paymentInfo: PaymentInfo? = null
)

@Serializable
data class LockRoomRequest(
    val isLocked: Boolean = true
)

@Serializable
data class ErrorResponse(
    val error: String,
    val code: String? = null
)
