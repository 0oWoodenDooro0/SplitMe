import { describe, it, expect } from 'vitest';
import { calculateSettlement } from '../financialCalculator';
import { Room, SplitType, FeeType, FeeAllocationMethod, RoundingMode } from '../../types/models';

describe('FinancialCalculator', () => {
  it('should calculate equal split with a single payer correctly', () => {
    const room: Room = {
      id: 'room-1',
      title: 'Dinner',
      code: 'ABC123',
      isLocked: false,
      currency: 'TWD',
      roundingMode: RoundingMode.NEAREST_INTEGER,
      members: [
        { id: 'm1', name: 'Alice', avatarColor: '#FF0000', isHost: true },
        { id: 'm2', name: 'Bob', avatarColor: '#00FF00', isHost: false },
        { id: 'm3', name: 'Charlie', avatarColor: '#0000FF', isHost: false },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Pizza',
          price: 300,
          paidByMemberId: 'm1',
          splits: [
            { memberId: 'm1', splitType: SplitType.EQUAL, value: 1.0 },
            { memberId: 'm2', splitType: SplitType.EQUAL, value: 1.0 },
            { memberId: 'm3', splitType: SplitType.EQUAL, value: 1.0 },
          ],
        },
      ],
      extraFees: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = calculateSettlement(room);

    expect(result.totalItemAmount).toBe(300);
    expect(result.totalFeeAmount).toBe(0);
    expect(result.grandTotal).toBe(300);
    expect(result.isBalanced).toBe(true);

    const m1 = result.memberSummaries['m1'];
    const m2 = result.memberSummaries['m2'];
    const m3 = result.memberSummaries['m3'];

    expect(m1.subtotal).toBe(100);
    expect(m1.totalToPay).toBe(100);
    expect(m1.totalPaid).toBe(300);
    expect(m1.netBalance).toBe(200);

    expect(m2.subtotal).toBe(100);
    expect(m2.totalToPay).toBe(100);
    expect(m2.totalPaid).toBe(0);
    expect(m2.netBalance).toBe(-100);

    expect(m3.subtotal).toBe(100);
    expect(m3.totalToPay).toBe(100);
    expect(m3.totalPaid).toBe(0);
    expect(m3.netBalance).toBe(-100);

    expect(result.transfers).toHaveLength(2);
    expect(result.transfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromMemberId: 'm2', toMemberId: 'm1', amount: 100 }),
        expect.objectContaining({ fromMemberId: 'm3', toMemberId: 'm1', amount: 100 }),
      ])
    );
  });

  it('should calculate weighted split correctly', () => {
    const room: Room = {
      id: 'room-2',
      title: 'Weighted Meal',
      code: 'WGT123',
      isLocked: false,
      currency: 'TWD',
      roundingMode: RoundingMode.NEAREST_INTEGER,
      members: [
        { id: 'm1', name: 'Alice', avatarColor: '#FF0000', isHost: true },
        { id: 'm2', name: 'Bob', avatarColor: '#00FF00', isHost: false },
        { id: 'm3', name: 'Charlie', avatarColor: '#0000FF', isHost: false },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Shared Feast',
          price: 900,
          paidByMemberId: 'm1',
          splits: [
            { memberId: 'm1', splitType: SplitType.WEIGHTED, value: 1.0 },
            { memberId: 'm2', splitType: SplitType.WEIGHTED, value: 1.5 },
            { memberId: 'm3', splitType: SplitType.WEIGHTED, value: 2.0 },
          ],
        },
      ],
      extraFees: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = calculateSettlement(room);

    const m1 = result.memberSummaries['m1'];
    const m2 = result.memberSummaries['m2'];
    const m3 = result.memberSummaries['m3'];

    expect(m1.subtotal).toBe(200);
    expect(m2.subtotal).toBe(300);
    expect(m3.subtotal).toBe(400);

    expect(m1.netBalance).toBe(700);
    expect(m2.netBalance).toBe(-300);
    expect(m3.netBalance).toBe(-400);
    expect(result.isBalanced).toBe(true);
  });

  it('should calculate exact amount split with remainder distribution', () => {
    const room: Room = {
      id: 'room-3',
      title: 'Custom Split',
      code: 'CUS123',
      isLocked: false,
      currency: 'TWD',
      roundingMode: RoundingMode.NEAREST_INTEGER,
      members: [
        { id: 'm1', name: 'Alice', avatarColor: '#FF0000', isHost: true },
        { id: 'm2', name: 'Bob', avatarColor: '#00FF00', isHost: false },
        { id: 'm3', name: 'Charlie', avatarColor: '#0000FF', isHost: false },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Steak & Drinks',
          price: 600,
          paidByMemberId: 'm1',
          splits: [
            { memberId: 'm1', splitType: SplitType.EXACT_AMOUNT, value: 200 },
            { memberId: 'm2', splitType: SplitType.EQUAL, value: 1.0 },
            { memberId: 'm3', splitType: SplitType.EQUAL, value: 1.0 },
          ],
        },
      ],
      extraFees: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = calculateSettlement(room);

    const m1 = result.memberSummaries['m1'];
    const m2 = result.memberSummaries['m2'];
    const m3 = result.memberSummaries['m3'];

    expect(m1.subtotal).toBe(200);
    expect(m2.subtotal).toBe(200);
    expect(m3.subtotal).toBe(200);
    expect(result.isBalanced).toBe(true);
  });

  it('should handle service fee and discount coupon allocation', () => {
    const room: Room = {
      id: 'room-4',
      title: 'Fancy Restaurant',
      code: 'FEE123',
      isLocked: false,
      currency: 'TWD',
      roundingMode: RoundingMode.NEAREST_INTEGER,
      members: [
        { id: 'm1', name: 'Alice', avatarColor: '#FF0000', isHost: true },
        { id: 'm2', name: 'Bob', avatarColor: '#00FF00', isHost: false },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Dish 1',
          price: 400,
          paidByMemberId: 'm1',
          splits: [
            { memberId: 'm1', splitType: SplitType.EXACT_AMOUNT, value: 300 },
            { memberId: 'm2', splitType: SplitType.EXACT_AMOUNT, value: 100 },
          ],
        },
      ],
      extraFees: [
        {
          id: 'fee-1',
          name: '10% Service Fee',
          feeType: FeeType.PERCENTAGE,
          rate: 0.10,
          allocationMethod: FeeAllocationMethod.PROPORTIONAL_SUBTOTAL,
        },
        {
          id: 'fee-2',
          name: 'Discount Voucher',
          feeType: FeeType.FIXED_AMOUNT,
          amount: -100,
          allocationMethod: FeeAllocationMethod.EQUAL_MEMBERS,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = calculateSettlement(room);

    expect(result.totalItemAmount).toBe(400);
    expect(result.totalFeeAmount).toBe(-60);
    expect(result.grandTotal).toBe(340);

    const m1 = result.memberSummaries['m1'];
    const m2 = result.memberSummaries['m2'];

    expect(m1.subtotal).toBe(300);
    expect(m1.totalToPay).toBe(280);

    expect(m2.subtotal).toBe(100);
    expect(m2.totalToPay).toBe(60);

    expect(result.isBalanced).toBe(true);
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0]).toEqual(
      expect.objectContaining({ fromMemberId: 'm2', toMemberId: 'm1', amount: 60 })
    );
  });

  it('should adjust TWD integer rounding using largest remainder method', () => {
    const room: Room = {
      id: 'room-5',
      title: 'TWD Rounding',
      code: 'TWD123',
      isLocked: false,
      currency: 'TWD',
      roundingMode: RoundingMode.NEAREST_INTEGER,
      members: [
        { id: 'm1', name: 'Alice', avatarColor: '#FF0000', isHost: true },
        { id: 'm2', name: 'Bob', avatarColor: '#00FF00', isHost: false },
        { id: 'm3', name: 'Charlie', avatarColor: '#0000FF', isHost: false },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Lunch',
          price: 1000,
          paidByMemberId: 'm1',
          splits: [
            { memberId: 'm1', splitType: SplitType.EQUAL, value: 1.0 },
            { memberId: 'm2', splitType: SplitType.EQUAL, value: 1.0 },
            { memberId: 'm3', splitType: SplitType.EQUAL, value: 1.0 },
          ],
        },
      ],
      extraFees: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = calculateSettlement(room);

    const m1 = result.memberSummaries['m1'];
    const m2 = result.memberSummaries['m2'];
    const m3 = result.memberSummaries['m3'];

    const totalToPaySum = m1.totalToPay + m2.totalToPay + m3.totalToPay;
    expect(totalToPaySum).toBe(1000);
    expect(result.isBalanced).toBe(true);
    expect(m1.netBalance + m2.netBalance + m3.netBalance).toBe(0);

    const amounts = [m1.totalToPay, m2.totalToPay, m3.totalToPay].sort((a, b) => a - b);
    expect(amounts).toEqual([333, 333, 334]);
  });
});
