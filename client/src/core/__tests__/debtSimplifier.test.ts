import { describe, it, expect } from 'vitest';
import { simplifyDebts } from '../debtSimplifier';

describe('DebtSimplifier', () => {
  it('should simplify basic debt matching with 2 debtors and 1 creditor', () => {
    const netBalances: Record<string, number> = {
      Alice: -100,
      Bob: -50,
      Charlie: 150,
    };

    const transfers = simplifyDebts(netBalances);

    expect(transfers).toHaveLength(2);
    const totalTransferred = transfers.reduce((acc, t) => acc + t.amount, 0);
    expect(totalTransferred).toBe(150);

    expect(transfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromMemberId: 'Alice', toMemberId: 'Charlie', amount: 100 }),
        expect.objectContaining({ fromMemberId: 'Bob', toMemberId: 'Charlie', amount: 50 }),
      ])
    );
  });

  it('should prioritize exact matches of equal debt and credit', () => {
    const netBalances: Record<string, number> = {
      A: -200,
      B: -300,
      C: 200,
      D: 300,
    };

    const transfers = simplifyDebts(netBalances);

    expect(transfers).toHaveLength(2);
    expect(transfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromMemberId: 'A', toMemberId: 'C', amount: 200 }),
        expect.objectContaining({ fromMemberId: 'B', toMemberId: 'D', amount: 300 }),
      ])
    );
  });

  it('should return empty array for all-zero net balances', () => {
    const netBalances: Record<string, number> = {
      A: 0,
      B: 0,
      C: 0,
    };

    const transfers = simplifyDebts(netBalances);
    expect(transfers).toEqual([]);
  });

  it('should bound transfer count to at most N - 1 for complex party network', () => {
    const netBalances: Record<string, number> = {
      m1: -500,
      m2: -300,
      m3: -200,
      m4: -100,
      m5: 400,
      m6: 700,
    };

    const transfers = simplifyDebts(netBalances);
    expect(transfers.length).toBeLessThanOrEqual(5);

    const remaining = { ...netBalances };
    for (const t of transfers) {
      remaining[t.fromMemberId] += t.amount;
      remaining[t.toMemberId] -= t.amount;
    }

    for (const [, bal] of Object.entries(remaining)) {
      expect(Math.abs(bal)).toBeLessThan(0.001);
    }
  });

  it('should handle empty map', () => {
    expect(simplifyDebts({})).toEqual([]);
  });
});
