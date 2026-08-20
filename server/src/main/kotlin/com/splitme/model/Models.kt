package com.splitme.model

import kotlinx.serialization.Serializable

@Serializable
enum class RoundingMode {
    NEAREST_INTEGER,
    ROUND_UP,
    ROUND_DOWN,
    DECIMAL_2
}

@Serializable
enum class SplitType {
    EQUAL,
    WEIGHTED,
    EXACT_AMOUNT
}

@Serializable
enum class FeeType {
    PERCENTAGE,
    FIXED_AMOUNT
}

@Serializable
enum class FeeAllocationMethod {
    PROPORTIONAL_SUBTOTAL,
    EQUAL_MEMBERS,
    SELECTED_MEMBERS
}

@Serializable
data class Member(
    val id: String,
    val name: String,
    val avatarColor: String,
    val isHost: Boolean = false
)

@Serializable
data class SplitShare(
    val memberId: String,
    val splitType: SplitType = SplitType.EQUAL,
    val value: Double = 1.0
)

@Serializable
data class Item(
    val id: String,
    val name: String,
    val price: Double,
    val paidByMemberId: String,
    val splits: List<SplitShare> = emptyList()
)

@Serializable
data class ExtraFee(
    val id: String,
    val name: String,
    val feeType: FeeType,
    val rate: Double = 0.0,
    val amount: Double = 0.0,
    val allocationMethod: FeeAllocationMethod = FeeAllocationMethod.PROPORTIONAL_SUBTOTAL,
    val targetMemberIds: List<String> = emptyList()
)

@Serializable
data class PaymentInfo(
    val bankCode: String? = null,
    val bankAccount: String? = null,
    val linePayUrl: String? = null,
    val jkoPayUrl: String? = null,
    val customQrUrl: String? = null,
    val note: String? = null
)

@Serializable
data class Room(
    val id: String,
    val title: String,
    val code: String,
    val isLocked: Boolean = false,
    val currency: String = "TWD",
    val roundingMode: RoundingMode = RoundingMode.NEAREST_INTEGER,
    val members: List<Member> = emptyList(),
    val items: List<Item> = emptyList(),
    val extraFees: List<ExtraFee> = emptyList(),
    val paymentInfo: PaymentInfo? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Serializable
data class TransferRoute(
    val fromMemberId: String,
    val toMemberId: String,
    val amount: Double,
    val adjustmentNote: String? = null
)

@Serializable
data class ItemShareDetail(
    val itemId: String,
    val itemName: String,
    val itemPrice: Double,
    val shareAmount: Double
)

@Serializable
data class FeeShareDetail(
    val feeId: String,
    val feeName: String,
    val shareAmount: Double
)

@Serializable
data class MemberFinancialSummary(
    val memberId: String,
    val subtotal: Double,
    val feesAndDiscounts: Double,
    val totalToPay: Double,
    val totalPaid: Double,
    val netBalance: Double,
    val itemBreakdown: List<ItemShareDetail> = emptyList(),
    val feeBreakdown: List<FeeShareDetail> = emptyList(),
    val roundingDifference: Double = 0.0,
    val adjustmentNote: String? = null
)

@Serializable
data class SettlementResult(
    val roomId: String,
    val totalItemAmount: Double,
    val totalFeeAmount: Double,
    val grandTotal: Double,
    val memberSummaries: Map<String, MemberFinancialSummary>,
    val transfers: List<TransferRoute>,
    val isBalanced: Boolean,
    val roundingRemainder: Double = 0.0
)
