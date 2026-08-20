package com.splitme.core

import com.splitme.model.TransferRoute
import kotlin.math.abs
import kotlin.math.min

object DebtSimplifier {
    private const val EPSILON = 0.0001

    fun simplifyDebts(netBalances: Map<String, Double>): List<TransferRoute> {
        val debtors = mutableMapOf<String, Double>() // netBalance < 0 => debt > 0
        val creditors = mutableMapOf<String, Double>() // netBalance > 0 => credit > 0

        for ((memberId, balance) in netBalances) {
            if (balance < -EPSILON) {
                debtors[memberId] = -balance
            } else if (balance > EPSILON) {
                creditors[memberId] = balance
            }
        }

        val transfers = mutableListOf<TransferRoute>()

        // 1. Exact match optimization: find pairs where debt == credit
        val debtorKeys = debtors.keys.toList()
        for (dKey in debtorKeys) {
            val dAmount = debtors[dKey] ?: continue
            val matchedCreditor = creditors.entries.firstOrNull { abs(dAmount - it.value) < EPSILON }
            if (matchedCreditor != null) {
                transfers.add(
                    TransferRoute(
                        fromMemberId = dKey,
                        toMemberId = matchedCreditor.key,
                        amount = dAmount
                    )
                )
                debtors.remove(dKey)
                creditors.remove(matchedCreditor.key)
            }
        }

        // 2. Greedy matching with remaining debts and credits
        while (debtors.isNotEmpty() && creditors.isNotEmpty()) {
            val maxDebtor = debtors.maxByOrNull { it.value } ?: break
            val maxCreditor = creditors.maxByOrNull { it.value } ?: break

            val transferAmount = min(maxDebtor.value, maxCreditor.value)

            transfers.add(
                TransferRoute(
                    fromMemberId = maxDebtor.key,
                    toMemberId = maxCreditor.key,
                    amount = transferAmount
                )
            )

            val remainingDebt = maxDebtor.value - transferAmount
            val remainingCredit = maxCreditor.value - transferAmount

            if (remainingDebt > EPSILON) {
                debtors[maxDebtor.key] = remainingDebt
            } else {
                debtors.remove(maxDebtor.key)
            }

            if (remainingCredit > EPSILON) {
                creditors[maxCreditor.key] = remainingCredit
            } else {
                creditors.remove(maxCreditor.key)
            }
        }

        return transfers
    }
}
