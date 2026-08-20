package com.splitme.core

import com.splitme.model.*
import kotlin.math.*

object FinancialCalculator {
    private const val EPSILON = 0.0001

    fun calculateSettlement(room: Room): SettlementResult {
        val memberMap = room.members.associateBy { it.id }
        val memberIds = room.members.map { it.id }

        val memberSubtotals = memberIds.associateWith { 0.0 }.toMutableMap()
        val memberItemBreakdowns = memberIds.associateWith { mutableListOf<ItemShareDetail>() }.toMutableMap()
        val memberRawPaid = memberIds.associateWith { 0.0 }.toMutableMap()

        // 1. Calculate item splits and payments
        for (item in room.items) {
            if (item.paidByMemberId in memberRawPaid) {
                memberRawPaid[item.paidByMemberId] = (memberRawPaid[item.paidByMemberId] ?: 0.0) + item.price
            }

            if (item.splits.isEmpty()) continue

            // Separate EXACT_AMOUNT and weighted/equal splits
            val exactSplits = item.splits.filter { it.splitType == SplitType.EXACT_AMOUNT }
            val nonExactSplits = item.splits.filter { it.splitType != SplitType.EXACT_AMOUNT }

            val totalExactAmount = exactSplits.sumOf { it.value }
            val remainingPrice = max(0.0, item.price - totalExactAmount)

            val totalWeight = nonExactSplits.sumOf { if (it.value > 0.0) it.value else 1.0 }

            for (split in exactSplits) {
                val share = split.value
                memberSubtotals[split.memberId] = (memberSubtotals[split.memberId] ?: 0.0) + share
                memberItemBreakdowns[split.memberId]?.add(
                    ItemShareDetail(
                        itemId = item.id,
                        itemName = item.name,
                        itemPrice = item.price,
                        shareAmount = share
                    )
                )
            }

            for (split in nonExactSplits) {
                val weight = if (split.value > 0.0) split.value else 1.0
                val share = if (totalWeight > 0.0) (remainingPrice * weight) / totalWeight else 0.0
                memberSubtotals[split.memberId] = (memberSubtotals[split.memberId] ?: 0.0) + share
                memberItemBreakdowns[split.memberId]?.add(
                    ItemShareDetail(
                        itemId = item.id,
                        itemName = item.name,
                        itemPrice = item.price,
                        shareAmount = share
                    )
                )
            }
        }

        val totalItemAmount = room.items.sumOf { it.price }

        // 2. Calculate extra fees and discounts
        val memberFeeBreakdowns = memberIds.associateWith { mutableListOf<FeeShareDetail>() }.toMutableMap()
        val memberFeeTotals = memberIds.associateWith { 0.0 }.toMutableMap()
        var totalFeeAmount = 0.0

        for (fee in room.extraFees) {
            val feeAmount = when (fee.feeType) {
                FeeType.PERCENTAGE -> totalItemAmount * fee.rate
                FeeType.FIXED_AMOUNT -> fee.amount
            }
            totalFeeAmount += feeAmount

            when (fee.allocationMethod) {
                FeeAllocationMethod.PROPORTIONAL_SUBTOTAL -> {
                    val applicableSubtotalSum = memberSubtotals.values.sum()
                    for (memberId in memberIds) {
                        val subtotal = memberSubtotals[memberId] ?: 0.0
                        val share = if (applicableSubtotalSum > 0.0) {
                            feeAmount * (subtotal / applicableSubtotalSum)
                        } else if (memberIds.isNotEmpty()) {
                            feeAmount / memberIds.size
                        } else {
                            0.0
                        }
                        memberFeeTotals[memberId] = (memberFeeTotals[memberId] ?: 0.0) + share
                        memberFeeBreakdowns[memberId]?.add(
                            FeeShareDetail(feeId = fee.id, feeName = fee.name, shareAmount = share)
                        )
                    }
                }
                FeeAllocationMethod.EQUAL_MEMBERS -> {
                    val count = memberIds.size
                    val share = if (count > 0) feeAmount / count else 0.0
                    for (memberId in memberIds) {
                        memberFeeTotals[memberId] = (memberFeeTotals[memberId] ?: 0.0) + share
                        memberFeeBreakdowns[memberId]?.add(
                            FeeShareDetail(feeId = fee.id, feeName = fee.name, shareAmount = share)
                        )
                    }
                }
                FeeAllocationMethod.SELECTED_MEMBERS -> {
                    val targets = if (fee.targetMemberIds.isNotEmpty()) fee.targetMemberIds else memberIds
                    val count = targets.size
                    val share = if (count > 0) feeAmount / count else 0.0
                    for (targetId in targets) {
                        memberFeeTotals[targetId] = (memberFeeTotals[targetId] ?: 0.0) + share
                        memberFeeBreakdowns[targetId]?.add(
                            FeeShareDetail(feeId = fee.id, feeName = fee.name, shareAmount = share)
                        )
                    }
                }
            }
        }

        val grandTotal = totalItemAmount + totalFeeAmount

        // 3. Raw due per member
        val rawDue = memberIds.associateWith { id ->
            (memberSubtotals[id] ?: 0.0) + (memberFeeTotals[id] ?: 0.0)
        }

        // Adjust total paid to reflect grand total (including surcharges & discounts at checkout)
        val memberTotalPaid = mutableMapOf<String, Double>()
        if (totalItemAmount > 0.0) {
            val paidRatio = grandTotal / totalItemAmount
            for (id in memberIds) {
                memberTotalPaid[id] = (memberRawPaid[id] ?: 0.0) * paidRatio
            }
        } else {
            for (id in memberIds) {
                memberTotalPaid[id] = memberRawPaid[id] ?: 0.0
            }
        }

        // 4. Rounding & Remainder Adjustment
        val totalToPayMap = mutableMapOf<String, Double>()
        val roundingDifferences = mutableMapOf<String, Double>()
        val adjustmentNotes = mutableMapOf<String, String>()

        when (room.roundingMode) {
            RoundingMode.NEAREST_INTEGER, RoundingMode.ROUND_UP, RoundingMode.ROUND_DOWN -> {
                val targetGrandTotal = round(grandTotal)
                val baseFloors = memberIds.associateWith { id -> floor(rawDue[id] ?: 0.0) }
                val totalBaseSum = baseFloors.values.sum()
                val remainder = (targetGrandTotal - totalBaseSum).roundToInt()

                // Sort members by: 1) remainder desc, 2) isHost desc, 3) id asc
                val sortedMembers = room.members.sortedWith(
                    compareByDescending<Member> { member ->
                        val due = rawDue[member.id] ?: 0.0
                        due - floor(due)
                    }
                        .thenByDescending { it.isHost }
                        .thenBy { it.id }
                )

                val assignedRemainder = mutableMapOf<String, Int>()
                memberIds.forEach { assignedRemainder[it] = 0 }

                if (remainder > 0) {
                    for (i in 0 until min(remainder, sortedMembers.size)) {
                        val mId = sortedMembers[i].id
                        assignedRemainder[mId] = 1
                    }
                } else if (remainder < 0) {
                    val reversedMembers = sortedMembers.reversed()
                    for (i in 0 until min(abs(remainder), reversedMembers.size)) {
                        val mId = reversedMembers[i].id
                        assignedRemainder[mId] = -1
                    }
                }

                for (member in room.members) {
                    val id = member.id
                    val finalPay = (baseFloors[id] ?: 0.0) + (assignedRemainder[id] ?: 0)
                    totalToPayMap[id] = finalPay
                    val diff = finalPay - (rawDue[id] ?: 0.0)
                    roundingDifferences[id] = diff

                    if (abs(diff) > 0.001) {
                        val sign = if (diff > 0) "+$" else "-$"
                        val diffInt = round(abs(diff)).toInt()
                        adjustmentNotes[id] = "尾數差額 $sign$diffInt 由 ${member.name} 吸收"
                    }
                }

                // If total paid has decimals due to fee scaling, round totalPaid as well
                for (id in memberIds) {
                    memberTotalPaid[id] = round(memberTotalPaid[id] ?: 0.0)
                }
            }
            RoundingMode.DECIMAL_2 -> {
                for (member in room.members) {
                    val id = member.id
                    val finalPay = round((rawDue[id] ?: 0.0) * 100.0) / 100.0
                    totalToPayMap[id] = finalPay
                    roundingDifferences[id] = finalPay - (rawDue[id] ?: 0.0)
                    memberTotalPaid[id] = round((memberTotalPaid[id] ?: 0.0) * 100.0) / 100.0
                }
            }
        }

        // 5. Build MemberFinancialSummary & Net Balance
        val memberSummaries = mutableMapOf<String, MemberFinancialSummary>()
        val netBalances = mutableMapOf<String, Double>()

        for (member in room.members) {
            val id = member.id
            val subtotal = memberSubtotals[id] ?: 0.0
            val fees = memberFeeTotals[id] ?: 0.0
            val toPay = totalToPayMap[id] ?: 0.0
            val paid = memberTotalPaid[id] ?: 0.0
            val net = paid - toPay

            netBalances[id] = net
            memberSummaries[id] = MemberFinancialSummary(
                memberId = id,
                subtotal = subtotal,
                feesAndDiscounts = fees,
                totalToPay = toPay,
                totalPaid = paid,
                netBalance = net,
                itemBreakdown = memberItemBreakdowns[id] ?: emptyList(),
                feeBreakdown = memberFeeBreakdowns[id] ?: emptyList(),
                roundingDifference = roundingDifferences[id] ?: 0.0,
                adjustmentNote = adjustmentNotes[id]
            )
        }

        // 6. Simplify debts
        val transfers = DebtSimplifier.simplifyDebts(netBalances)
        val isBalanced = abs(netBalances.values.sum()) < EPSILON

        return SettlementResult(
            roomId = room.id,
            totalItemAmount = totalItemAmount,
            totalFeeAmount = totalFeeAmount,
            grandTotal = grandTotal,
            memberSummaries = memberSummaries,
            transfers = transfers,
            isBalanced = isBalanced,
            roundingRemainder = roundingDifferences.values.sum()
        )
    }
}
