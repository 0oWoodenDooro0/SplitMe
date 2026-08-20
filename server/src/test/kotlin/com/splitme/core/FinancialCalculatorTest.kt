package com.splitme.core

import com.splitme.model.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class FinancialCalculatorTest {

    @Test
    fun `test equal split with single payer`() {
        val room = Room(
            id = "room-1",
            title = "Dinner",
            code = "ABC123",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true),
                Member(id = "m2", name = "Bob", avatarColor = "#00FF00"),
                Member(id = "m3", name = "Charlie", avatarColor = "#0000FF")
            ),
            items = listOf(
                Item(
                    id = "item-1",
                    name = "Pizza",
                    price = 300.0,
                    paidByMemberId = "m1",
                    splits = listOf(
                        SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m2", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m3", splitType = SplitType.EQUAL, value = 1.0)
                    )
                )
            )
        )

        val result = FinancialCalculator.calculateSettlement(room)

        assertEquals(300.0, result.totalItemAmount)
        assertEquals(0.0, result.totalFeeAmount)
        assertEquals(300.0, result.grandTotal)
        assertTrue(result.isBalanced)

        val m1Summary = result.memberSummaries["m1"]!!
        val m2Summary = result.memberSummaries["m2"]!!
        val m3Summary = result.memberSummaries["m3"]!!

        assertEquals(100.0, m1Summary.subtotal)
        assertEquals(100.0, m1Summary.totalToPay)
        assertEquals(300.0, m1Summary.totalPaid)
        assertEquals(200.0, m1Summary.netBalance)

        assertEquals(100.0, m2Summary.subtotal)
        assertEquals(100.0, m2Summary.totalToPay)
        assertEquals(0.0, m2Summary.totalPaid)
        assertEquals(-100.0, m2Summary.netBalance)

        assertEquals(100.0, m3Summary.subtotal)
        assertEquals(100.0, m3Summary.totalToPay)
        assertEquals(0.0, m3Summary.totalPaid)
        assertEquals(-100.0, m3Summary.netBalance)

        assertEquals(2, result.transfers.size)
        val transferFromM2 = result.transfers.first { it.fromMemberId == "m2" }
        val transferFromM3 = result.transfers.first { it.fromMemberId == "m3" }
        assertEquals("m1", transferFromM2.toMemberId)
        assertEquals(100.0, transferFromM2.amount)
        assertEquals("m1", transferFromM3.toMemberId)
        assertEquals(100.0, transferFromM3.amount)
    }

    @Test
    fun `test weighted split calculation`() {
        val room = Room(
            id = "room-2",
            title = "Weighted Meal",
            code = "WGT123",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000"),
                Member(id = "m2", name = "Bob", avatarColor = "#00FF00"),
                Member(id = "m3", name = "Charlie", avatarColor = "#0000FF")
            ),
            items = listOf(
                Item(
                    id = "item-1",
                    name = "Shared Feast",
                    price = 900.0,
                    paidByMemberId = "m1",
                    splits = listOf(
                        SplitShare(memberId = "m1", splitType = SplitType.WEIGHTED, value = 1.0),
                        SplitShare(memberId = "m2", splitType = SplitType.WEIGHTED, value = 1.5),
                        SplitShare(memberId = "m3", splitType = SplitType.WEIGHTED, value = 2.0)
                    )
                )
            )
        )

        val result = FinancialCalculator.calculateSettlement(room)

        val m1 = result.memberSummaries["m1"]!!
        val m2 = result.memberSummaries["m2"]!!
        val m3 = result.memberSummaries["m3"]!!

        assertEquals(200.0, m1.subtotal)
        assertEquals(300.0, m2.subtotal)
        assertEquals(400.0, m3.subtotal)
        assertEquals(700.0, m1.netBalance)
        assertEquals(-300.0, m2.netBalance)
        assertEquals(-400.0, m3.netBalance)
        assertTrue(result.isBalanced)
    }

    @Test
    fun `test exact amount split with remainder distribution`() {
        val room = Room(
            id = "room-3",
            title = "Custom Split",
            code = "CUS123",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000"),
                Member(id = "m2", name = "Bob", avatarColor = "#00FF00"),
                Member(id = "m3", name = "Charlie", avatarColor = "#0000FF")
            ),
            items = listOf(
                Item(
                    id = "item-1",
                    name = "Steak & Drinks",
                    price = 600.0,
                    paidByMemberId = "m1",
                    splits = listOf(
                        SplitShare(memberId = "m1", splitType = SplitType.EXACT_AMOUNT, value = 200.0),
                        SplitShare(memberId = "m2", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m3", splitType = SplitType.EQUAL, value = 1.0)
                    )
                )
            )
        )

        val result = FinancialCalculator.calculateSettlement(room)

        val m1 = result.memberSummaries["m1"]!!
        val m2 = result.memberSummaries["m2"]!!
        val m3 = result.memberSummaries["m3"]!!

        assertEquals(200.0, m1.subtotal)
        assertEquals(200.0, m2.subtotal)
        assertEquals(200.0, m3.subtotal)
        assertTrue(result.isBalanced)
    }

    @Test
    fun `test service fee and discount coupon allocation`() {
        val room = Room(
            id = "room-4",
            title = "Fancy Restaurant",
            code = "FEE123",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000"),
                Member(id = "m2", name = "Bob", avatarColor = "#00FF00")
            ),
            items = listOf(
                Item(
                    id = "item-1",
                    name = "Dish 1",
                    price = 400.0,
                    paidByMemberId = "m1",
                    splits = listOf(
                        SplitShare(memberId = "m1", splitType = SplitType.EXACT_AMOUNT, value = 300.0),
                        SplitShare(memberId = "m2", splitType = SplitType.EXACT_AMOUNT, value = 100.0)
                    )
                )
            ),
            extraFees = listOf(
                ExtraFee(
                    id = "fee-1",
                    name = "10% Service Fee",
                    feeType = FeeType.PERCENTAGE,
                    rate = 0.10,
                    allocationMethod = FeeAllocationMethod.PROPORTIONAL_SUBTOTAL
                ),
                ExtraFee(
                    id = "fee-2",
                    name = "Discount Voucher",
                    feeType = FeeType.FIXED_AMOUNT,
                    amount = -100.0,
                    allocationMethod = FeeAllocationMethod.EQUAL_MEMBERS
                )
            )
        )

        val result = FinancialCalculator.calculateSettlement(room)

        assertEquals(400.0, result.totalItemAmount)
        assertEquals(-60.0, result.totalFeeAmount) // 40 - 100 = -60
        assertEquals(340.0, result.grandTotal)

        val m1 = result.memberSummaries["m1"]!!
        val m2 = result.memberSummaries["m2"]!!

        // m1: subtotal 300, 10% fee = 30, discount = -50 => totalToPay = 280
        assertEquals(300.0, m1.subtotal)
        assertEquals(280.0, m1.totalToPay)

        // m2: subtotal 100, 10% fee = 10, discount = -50 => totalToPay = 60
        assertEquals(100.0, m2.subtotal)
        assertEquals(60.0, m2.totalToPay)

        assertEquals(280.0 + 60.0, result.grandTotal)
        assertTrue(result.isBalanced)

        assertEquals(1, result.transfers.size)
        assertEquals("m2", result.transfers[0].fromMemberId)
        assertEquals("m1", result.transfers[0].toMemberId)
        assertEquals(60.0, result.transfers[0].amount)
    }

    @Test
    fun `test TWD integer rounding with largest remainder method`() {
        val room = Room(
            id = "room-5",
            title = "TWD Rounding",
            code = "TWD123",
            roundingMode = RoundingMode.NEAREST_INTEGER,
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000", isHost = true),
                Member(id = "m2", name = "Bob", avatarColor = "#00FF00"),
                Member(id = "m3", name = "Charlie", avatarColor = "#0000FF")
            ),
            items = listOf(
                Item(
                    id = "item-1",
                    name = "Lunch",
                    price = 1000.0,
                    paidByMemberId = "m1",
                    splits = listOf(
                        SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m2", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m3", splitType = SplitType.EQUAL, value = 1.0)
                    )
                )
            )
        )

        val result = FinancialCalculator.calculateSettlement(room)

        val m1 = result.memberSummaries["m1"]!!
        val m2 = result.memberSummaries["m2"]!!
        val m3 = result.memberSummaries["m3"]!!

        val totalToPaySum = m1.totalToPay + m2.totalToPay + m3.totalToPay
        assertEquals(1000.0, totalToPaySum)
        assertTrue(result.isBalanced)
        assertEquals(0.0, m1.netBalance + m2.netBalance + m3.netBalance)

        val amounts = listOf(m1.totalToPay, m2.totalToPay, m3.totalToPay).sorted()
        assertEquals(listOf(333.0, 333.0, 334.0), amounts)
    }

    @Test
    fun `test multiple items and multiple payers`() {
        val room = Room(
            id = "room-6",
            title = "Trip Expenses",
            code = "TRP123",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000"),
                Member(id = "m2", name = "Bob", avatarColor = "#00FF00"),
                Member(id = "m3", name = "Charlie", avatarColor = "#0000FF")
            ),
            items = listOf(
                Item(
                    id = "item-1",
                    name = "Gas",
                    price = 600.0,
                    paidByMemberId = "m1",
                    splits = listOf(
                        SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m2", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m3", splitType = SplitType.EQUAL, value = 1.0)
                    )
                ),
                Item(
                    id = "item-2",
                    name = "Hotel",
                    price = 900.0,
                    paidByMemberId = "m2",
                    splits = listOf(
                        SplitShare(memberId = "m1", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m2", splitType = SplitType.EQUAL, value = 1.0),
                        SplitShare(memberId = "m3", splitType = SplitType.EQUAL, value = 1.0)
                    )
                )
            )
        )

        val result = FinancialCalculator.calculateSettlement(room)

        assertEquals(1500.0, result.grandTotal)
        assertTrue(result.isBalanced)

        val m1 = result.memberSummaries["m1"]!!
        val m2 = result.memberSummaries["m2"]!!
        val m3 = result.memberSummaries["m3"]!!

        assertEquals(500.0, m1.totalToPay)
        assertEquals(600.0, m1.totalPaid)
        assertEquals(100.0, m1.netBalance)

        assertEquals(500.0, m2.totalToPay)
        assertEquals(900.0, m2.totalPaid)
        assertEquals(400.0, m2.netBalance)

        assertEquals(500.0, m3.totalToPay)
        assertEquals(0.0, m3.totalPaid)
        assertEquals(-500.0, m3.netBalance)

        val totalTransfers = result.transfers.sumOf { it.amount }
        assertEquals(500.0, totalTransfers)
    }

    @Test
    fun `test empty items and boundary conditions`() {
        val emptyRoom = Room(
            id = "room-empty",
            title = "Empty",
            code = "EMP123",
            members = listOf(
                Member(id = "m1", name = "Alice", avatarColor = "#FF0000")
            ),
            items = emptyList()
        )

        val result = FinancialCalculator.calculateSettlement(emptyRoom)
        assertEquals(0.0, result.grandTotal)
        assertTrue(result.transfers.isEmpty())
        assertTrue(result.isBalanced)
    }
}
