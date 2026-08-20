package com.splitme.core

import com.splitme.model.TransferRoute
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class DebtSimplifierTest {

    @Test
    fun `test simple greedy matching with 2 debtors and 1 creditor`() {
        val netBalances = mapOf(
            "Alice" to -100.0,
            "Bob" to -50.0,
            "Charlie" to 150.0
        )

        val transfers = DebtSimplifier.simplifyDebts(netBalances)

        assertEquals(2, transfers.size)
        val totalTransferred = transfers.sumOf { it.amount }
        assertEquals(150.0, totalTransferred)

        assertTrue(transfers.any { it.fromMemberId == "Alice" && it.toMemberId == "Charlie" && it.amount == 100.0 })
        assertTrue(transfers.any { it.fromMemberId == "Bob" && it.toMemberId == "Charlie" && it.amount == 50.0 })
    }

    @Test
    fun `test exact match optimization prioritizes pairs of equal debt and credit`() {
        val netBalances = mapOf(
            "A" to -200.0,
            "B" to -300.0,
            "C" to 200.0,
            "D" to 300.0
        )

        val transfers = DebtSimplifier.simplifyDebts(netBalances)

        assertEquals(2, transfers.size)
        assertTrue(transfers.any { it.fromMemberId == "A" && it.toMemberId == "C" && it.amount == 200.0 })
        assertTrue(transfers.any { it.fromMemberId == "B" && it.toMemberId == "D" && it.amount == 300.0 })
    }

    @Test
    fun `test cyclic debt resolution collapses to zero transfers when net balances are zero`() {
        val netBalances = mapOf(
            "A" to 0.0,
            "B" to 0.0,
            "C" to 0.0,
            "D" to 0.0
        )

        val transfers = DebtSimplifier.simplifyDebts(netBalances)

        assertTrue(transfers.isEmpty())
    }

    @Test
    fun `test complex multi-party debt simplifies to at most N minus 1 transfers`() {
        val netBalances = mapOf(
            "m1" to -500.0,
            "m2" to -300.0,
            "m3" to -200.0,
            "m4" to -100.0,
            "m5" to 400.0,
            "m6" to 700.0
        )
        // 6 non-zero members -> transfers should be <= 5
        val transfers = DebtSimplifier.simplifyDebts(netBalances)

        assertTrue(transfers.size <= 5, "Transfers size ${transfers.size} should be <= 5")

        // Verify all debts are completely settled
        val remaining = netBalances.toMutableMap()
        for (t in transfers) {
            remaining[t.fromMemberId] = (remaining[t.fromMemberId] ?: 0.0) + t.amount
            remaining[t.toMemberId] = (remaining[t.toMemberId] ?: 0.0) - t.amount
        }

        for ((member, bal) in remaining) {
            assertEquals(0.0, bal, 0.001, "Member $member balance not settled: $bal")
        }
    }

    @Test
    fun `test empty balance map returns empty transfers`() {
        val transfers = DebtSimplifier.simplifyDebts(emptyMap())
        assertTrue(transfers.isEmpty())
    }
}
