export type Structure = 'amortizing' | 'interest_only';

export interface ScheduleRow {
  installmentNo: number; dueDate: Date;
  openingPaise: number; interestPaise: number; principalPaise: number;
  paymentPaise: number; closingPaise: number;
}

/** Nominal annual rate compounded monthly, end-of-month payments.
 *  2,50,000 @ 21% for 18 months (amortizing) gives an EMI of 16,311. */
export function buildSchedule(p: {
  principalPaise: number; annualRatePct: number; months: number; structure: Structure; startDate: Date;
}): ScheduleRow[] {
  const r = p.annualRatePct / 1200;
  const n = p.months;
  const emi = r === 0 ? p.principalPaise / n
                      : p.principalPaise * r * (1 + r) ** n / ((1 + r) ** n - 1);
  const rows: ScheduleRow[] = [];
  let balance = p.principalPaise;

  for (let i = 1; i <= n; i++) {
    const interest  = Math.round(balance * r);
    let principal   = p.structure === 'amortizing' ? Math.round(emi) - interest : 0;
    if (i === n) principal = balance;                  // last row absorbs rounding
    const due = new Date(p.startDate); due.setMonth(due.getMonth() + i);
    rows.push({ installmentNo: i, dueDate: due, openingPaise: balance, interestPaise: interest,
                principalPaise: principal, paymentPaise: interest + principal, closingPaise: balance - principal });
    balance -= principal;
  }
  return rows;
}
