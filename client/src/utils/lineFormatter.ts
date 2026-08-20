import { Room, SettlementResult } from '../types/models';
import { formatCurrency } from './formatters';

export interface LineFormatterOptions {
  includeTransfers?: boolean;
  includePaymentInfo?: boolean;
}

export function formatLineSummary(
  room: Room,
  settlement: SettlementResult,
  options: LineFormatterOptions = { includeTransfers: true, includePaymentInfo: true }
): string {
  const currency = room.currency || 'NT$';
  const memberMap = new Map(room.members.map((m) => [m.id, m]));
  const lines: string[] = [];

  // Title
  lines.push(`🧾【SplitMe 結算收據】${room.title || '聚餐分帳'}`);
  lines.push('━━━━━━━━━━━━━━━━━━');

  // Total Summary
  let feePart = '';
  if (settlement.totalFeeAmount > 0) {
    feePart = ` ＋ 附加費 ${formatCurrency(settlement.totalFeeAmount, currency)}`;
  }
  lines.push(
    `💰 總支出：${formatCurrency(settlement.grandTotal, currency)}（品項 ${formatCurrency(settlement.totalItemAmount, currency)}${feePart}）`
  );
  lines.push('');

  // Member Summaries
  lines.push('👥【各成員應付/應收明細】');
  room.members.forEach((m) => {
    const summary = settlement.memberSummaries[m.id];
    if (!summary) return;

    let netStatus = '已平衡';
    if (summary.netBalance > 0.01) {
      netStatus = `需收款 ${formatCurrency(summary.netBalance, currency)}`;
    } else if (summary.netBalance < -0.01) {
      netStatus = `需支付 ${formatCurrency(Math.abs(summary.netBalance), currency)}`;
    }

    const hostTag = m.isHost ? ' (主揪)' : '';
    lines.push(
      `• ${m.name}${hostTag}：已墊付 ${formatCurrency(summary.totalPaid, currency)} ｜ 應付 ${formatCurrency(summary.totalToPay, currency)} ➔ ${netStatus}`
    );
  });
  lines.push('');

  // Transfers
  if (options.includeTransfers !== false) {
    if (settlement.transfers.length > 0) {
      lines.push('💸【最簡轉帳指南】');
      const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      settlement.transfers.forEach((t, idx) => {
        const fromName = memberMap.get(t.fromMemberId)?.name || '未知成員';
        const toName = memberMap.get(t.toMemberId)?.name || '未知成員';
        const emoji = numberEmojis[idx] || `${idx + 1}.`;
        lines.push(`${emoji} ${fromName} ➔ ${toName} ${formatCurrency(t.amount, currency)}`);
      });
      lines.push('');
    } else {
      lines.push('✨ 收支已完全平衡，無需任何轉帳！');
      lines.push('');
    }
  }

  // Payment Info
  if (options.includePaymentInfo !== false && room.paymentInfo) {
    const { bankCode, bankAccount, note } = room.paymentInfo;
    const hasPaymentDetails = bankCode || bankAccount || note;

    if (hasPaymentDetails) {
      lines.push('🏦【收款資訊】');
      if (bankCode) {
        lines.push(`• 銀行代碼：${bankCode}`);
      }
      if (bankAccount) {
        lines.push(`• 銀行帳號：${bankAccount}`);
      }
      if (note) {
        lines.push(`• 備註：${note}`);
      }
      lines.push('');
    }
  }

  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('✨ 由 SplitMe 極速聚餐分帳產出');

  return lines.join('\n');
}

export function getLineShareUrl(text: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}
