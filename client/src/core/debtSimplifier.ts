import { TransferRoute } from '../types/models';

const EPSILON = 0.0001;

export function simplifyDebts(netBalances: Record<string, number>): TransferRoute[] {
  const debtors: Record<string, number> = {};
  const creditors: Record<string, number> = {};

  for (const [memberId, balance] of Object.entries(netBalances)) {
    if (balance < -EPSILON) {
      debtors[memberId] = -balance;
    } else if (balance > EPSILON) {
      creditors[memberId] = balance;
    }
  }

  const transfers: TransferRoute[] = [];

  // 1. Exact match optimization: find pairs where debt == credit
  const debtorKeys = Object.keys(debtors);
  for (const dKey of debtorKeys) {
    const dAmount = debtors[dKey];
    if (dAmount === undefined) continue;

    for (const [cKey, cAmount] of Object.entries(creditors)) {
      if (Math.abs(dAmount - cAmount) < EPSILON) {
        transfers.push({
          fromMemberId: dKey,
          toMemberId: cKey,
          amount: dAmount,
        });
        delete debtors[dKey];
        delete creditors[cKey];
        break;
      }
    }
  }

  // 2. Greedy matching with remaining debts and credits
  while (Object.keys(debtors).length > 0 && Object.keys(creditors).length > 0) {
    let maxDebtorKey = '';
    let maxDebt = -Infinity;
    for (const [dKey, dAmount] of Object.entries(debtors)) {
      if (dAmount > maxDebt) {
        maxDebt = dAmount;
        maxDebtorKey = dKey;
      }
    }

    let maxCreditorKey = '';
    let maxCredit = -Infinity;
    for (const [cKey, cAmount] of Object.entries(creditors)) {
      if (cAmount > maxCredit) {
        maxCredit = cAmount;
        maxCreditorKey = cKey;
      }
    }

    if (!maxDebtorKey || !maxCreditorKey) break;

    const transferAmount = Math.min(maxDebt, maxCredit);

    transfers.push({
      fromMemberId: maxDebtorKey,
      toMemberId: maxCreditorKey,
      amount: transferAmount,
    });

    const remainingDebt = maxDebt - transferAmount;
    const remainingCredit = maxCredit - transferAmount;

    if (remainingDebt > EPSILON) {
      debtors[maxDebtorKey] = remainingDebt;
    } else {
      delete debtors[maxDebtorKey];
    }

    if (remainingCredit > EPSILON) {
      creditors[maxCreditorKey] = remainingCredit;
    } else {
      delete creditors[maxCreditorKey];
    }
  }

  return transfers;
}
