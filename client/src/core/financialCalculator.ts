import {
  FeeAllocationMethod,
  FeeShareDetail,
  FeeType,
  ItemShareDetail,
  Member,
  MemberFinancialSummary,
  Room,
  RoundingMode,
  SettlementResult,
  SplitType,
} from '../types/models';
import { simplifyDebts } from './debtSimplifier';

const EPSILON = 0.0001;

export function calculateSettlement(room: Room): SettlementResult {
  const memberMap = new Map<string, Member>();
  const memberIds: string[] = [];

  for (const m of room.members) {
    memberMap.set(m.id, m);
    memberIds.push(m.id);
  }

  const memberSubtotals: Record<string, number> = {};
  const memberItemBreakdowns: Record<string, ItemShareDetail[]> = {};
  const memberRawPaid: Record<string, number> = {};

  for (const id of memberIds) {
    memberSubtotals[id] = 0;
    memberItemBreakdowns[id] = [];
    memberRawPaid[id] = 0;
  }

  // 1. Calculate item splits and payments
  for (const item of room.items || []) {
    if (memberRawPaid[item.paidByMemberId] !== undefined) {
      memberRawPaid[item.paidByMemberId] += item.price;
    }

    const splits = item.splits || [];
    if (splits.length === 0) continue;

    const exactSplits = splits.filter((s) => s.splitType === SplitType.EXACT_AMOUNT);
    const nonExactSplits = splits.filter((s) => s.splitType !== SplitType.EXACT_AMOUNT);

    const totalExactAmount = exactSplits.reduce((acc, s) => acc + (s.value || 0), 0);
    const remainingPrice = Math.max(0, item.price - totalExactAmount);

    const totalWeight = nonExactSplits.reduce((acc, s) => acc + (s.value !== undefined && s.value > 0 ? s.value : 1.0), 0);

    for (const split of exactSplits) {
      const share = split.value || 0;
      if (memberSubtotals[split.memberId] !== undefined) {
        memberSubtotals[split.memberId] += share;
        memberItemBreakdowns[split.memberId].push({
          itemId: item.id,
          itemName: item.name,
          itemPrice: item.price,
          shareAmount: share,
        });
      }
    }

    for (const split of nonExactSplits) {
      const weight = split.value !== undefined && split.value > 0 ? split.value : 1.0;
      const share = totalWeight > 0 ? (remainingPrice * weight) / totalWeight : 0;
      if (memberSubtotals[split.memberId] !== undefined) {
        memberSubtotals[split.memberId] += share;
        memberItemBreakdowns[split.memberId].push({
          itemId: item.id,
          itemName: item.name,
          itemPrice: item.price,
          shareAmount: share,
        });
      }
    }
  }

  const totalItemAmount = (room.items || []).reduce((acc, item) => acc + item.price, 0);

  // 2. Calculate extra fees and discounts
  const memberFeeBreakdowns: Record<string, FeeShareDetail[]> = {};
  const memberFeeTotals: Record<string, number> = {};
  for (const id of memberIds) {
    memberFeeBreakdowns[id] = [];
    memberFeeTotals[id] = 0;
  }
  let totalFeeAmount = 0;

  for (const fee of room.extraFees || []) {
    let feeAmount = 0;
    if (fee.feeType === FeeType.PERCENTAGE) {
      feeAmount = totalItemAmount * (fee.rate || 0);
    } else if (fee.feeType === FeeType.FIXED_AMOUNT) {
      feeAmount = fee.amount || 0;
    }
    totalFeeAmount += feeAmount;

    const allocation = fee.allocationMethod || FeeAllocationMethod.PROPORTIONAL_SUBTOTAL;

    if (allocation === FeeAllocationMethod.PROPORTIONAL_SUBTOTAL) {
      const applicableSubtotalSum = Object.values(memberSubtotals).reduce((a, b) => a + b, 0);
      for (const id of memberIds) {
        const subtotal = memberSubtotals[id] || 0;
        const share =
          applicableSubtotalSum > 0
            ? feeAmount * (subtotal / applicableSubtotalSum)
            : memberIds.length > 0
              ? feeAmount / memberIds.length
              : 0;
        memberFeeTotals[id] += share;
        memberFeeBreakdowns[id].push({ feeId: fee.id, feeName: fee.name, shareAmount: share });
      }
    } else if (allocation === FeeAllocationMethod.EQUAL_MEMBERS) {
      const count = memberIds.length;
      const share = count > 0 ? feeAmount / count : 0;
      for (const id of memberIds) {
        memberFeeTotals[id] += share;
        memberFeeBreakdowns[id].push({ feeId: fee.id, feeName: fee.name, shareAmount: share });
      }
    } else if (allocation === FeeAllocationMethod.SELECTED_MEMBERS) {
      const targets = fee.targetMemberIds && fee.targetMemberIds.length > 0 ? fee.targetMemberIds : memberIds;
      const count = targets.length;
      const share = count > 0 ? feeAmount / count : 0;
      for (const targetId of targets) {
        if (memberFeeTotals[targetId] !== undefined) {
          memberFeeTotals[targetId] += share;
          memberFeeBreakdowns[targetId].push({ feeId: fee.id, feeName: fee.name, shareAmount: share });
        }
      }
    }
  }

  const grandTotal = totalItemAmount + totalFeeAmount;

  // 3. Raw due per member
  const rawDue: Record<string, number> = {};
  for (const id of memberIds) {
    rawDue[id] = (memberSubtotals[id] || 0) + (memberFeeTotals[id] || 0);
  }

  // Adjust total paid to reflect grand total
  const memberTotalPaid: Record<string, number> = {};
  if (totalItemAmount > 0) {
    const paidRatio = grandTotal / totalItemAmount;
    for (const id of memberIds) {
      memberTotalPaid[id] = (memberRawPaid[id] || 0) * paidRatio;
    }
  } else {
    for (const id of memberIds) {
      memberTotalPaid[id] = memberRawPaid[id] || 0;
    }
  }

  // 4. Rounding & Remainder Adjustment
  const totalToPayMap: Record<string, number> = {};
  const roundingDifferences: Record<string, number> = {};
  const adjustmentNotes: Record<string, string> = {};
  const roundingMode = room.roundingMode || RoundingMode.NEAREST_INTEGER;

  if (
    roundingMode === RoundingMode.NEAREST_INTEGER ||
    roundingMode === RoundingMode.ROUND_UP ||
    roundingMode === RoundingMode.ROUND_DOWN
  ) {
    const targetGrandTotal = Math.round(grandTotal);
    const baseFloors: Record<string, number> = {};
    let totalBaseSum = 0;
    for (const id of memberIds) {
      const floorVal = Math.floor(rawDue[id] || 0);
      baseFloors[id] = floorVal;
      totalBaseSum += floorVal;
    }
    const remainder = Math.round(targetGrandTotal - totalBaseSum);

    // Sort members by: 1) remainder desc, 2) isHost desc, 3) id asc
    const sortedMembers = [...room.members].sort((a, b) => {
      const dueA = rawDue[a.id] || 0;
      const dueB = rawDue[b.id] || 0;
      const remA = dueA - Math.floor(dueA);
      const remB = dueB - Math.floor(dueB);
      if (Math.abs(remB - remA) > 1e-9) {
        return remB - remA;
      }
      if ((b.isHost ? 1 : 0) !== (a.isHost ? 1 : 0)) {
        return (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0);
      }
      return a.id.localeCompare(b.id);
    });

    const assignedRemainder: Record<string, number> = {};
    for (const id of memberIds) {
      assignedRemainder[id] = 0;
    }

    if (remainder > 0) {
      for (let i = 0; i < Math.min(remainder, sortedMembers.length); i++) {
        assignedRemainder[sortedMembers[i].id] = 1;
      }
    } else if (remainder < 0) {
      const reversed = [...sortedMembers].reverse();
      for (let i = 0; i < Math.min(Math.abs(remainder), reversed.length); i++) {
        assignedRemainder[reversed[i].id] = -1;
      }
    }

    for (const member of room.members) {
      const id = member.id;
      const finalPay = (baseFloors[id] || 0) + (assignedRemainder[id] || 0);
      totalToPayMap[id] = finalPay;
      const diff = finalPay - (rawDue[id] || 0);
      roundingDifferences[id] = diff;

      if (Math.abs(diff) > 0.001) {
        const sign = diff > 0 ? '+$' : '-$';
        const diffInt = Math.round(Math.abs(diff));
        adjustmentNotes[id] = `尾數差額 ${sign}${diffInt} 由 ${member.name} 吸收`;
      }
    }

    for (const id of memberIds) {
      memberTotalPaid[id] = Math.round(memberTotalPaid[id] || 0);
    }
  } else {
    for (const member of room.members) {
      const id = member.id;
      const finalPay = Math.round((rawDue[id] || 0) * 100) / 100;
      totalToPayMap[id] = finalPay;
      roundingDifferences[id] = finalPay - (rawDue[id] || 0);
      memberTotalPaid[id] = Math.round((memberTotalPaid[id] || 0) * 100) / 100;
    }
  }

  // 5. Build MemberFinancialSummary & Net Balance
  const memberSummaries: Record<string, MemberFinancialSummary> = {};
  const netBalances: Record<string, number> = {};

  for (const member of room.members) {
    const id = member.id;
    const subtotal = memberSubtotals[id] || 0;
    const fees = memberFeeTotals[id] || 0;
    const toPay = totalToPayMap[id] || 0;
    const paid = memberTotalPaid[id] || 0;
    const net = paid - toPay;

    netBalances[id] = net;
    memberSummaries[id] = {
      memberId: id,
      subtotal,
      feesAndDiscounts: fees,
      totalToPay: toPay,
      totalPaid: paid,
      netBalance: net,
      itemBreakdown: memberItemBreakdowns[id] || [],
      feeBreakdown: memberFeeBreakdowns[id] || [],
      roundingDifference: roundingDifferences[id] || 0,
      adjustmentNote: adjustmentNotes[id],
    };
  }

  // 6. Simplify debts
  const transfers = simplifyDebts(netBalances);
  const totalNetBalance = Object.values(netBalances).reduce((a, b) => a + b, 0);
  const isBalanced = Math.abs(totalNetBalance) < EPSILON;
  const roundingRemainder = Object.values(roundingDifferences).reduce((a, b) => a + b, 0);

  return {
    roomId: room.id,
    totalItemAmount,
    totalFeeAmount,
    grandTotal,
    memberSummaries,
    transfers,
    isBalanced,
    roundingRemainder,
  };
}
