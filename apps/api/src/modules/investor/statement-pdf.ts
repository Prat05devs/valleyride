import PDFDocument from 'pdfkit';
import type { investorService } from './investor.service';

type Inv = Awaited<ReturnType<typeof investorService.myInvestment>>;
const inr = (p: number) => `Rs ${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** One-page statement for an investment: terms, schedule and what has been paid. Built with pdfkit's core fonts. */
export function statementPdf(inv: Inv): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Valley Ride Capital statement ${inv.ref}` } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica').fontSize(20).text('Valley Ride Capital');
    doc.fontSize(10).fillColor('#66686B').text(`Statement for ${inv.ref} · generated ${new Date().toISOString().slice(0, 10)}`);
    doc.moveDown();
    doc.fillColor('#000').fontSize(11);
    doc.text(`Investor: ${inv.investorName ?? '—'}${inv.panMasked ? ` · PAN ${inv.panMasked}` : ''}`);
    doc.text(`Principal: ${inr(inv.principalPaise)} · ${inv.annualRatePct}% a year · ${inv.tenureMonths} months · ${inv.structure === 'amortizing' ? 'equal monthly instalments' : 'interest only, principal at maturity'}`);
    doc.text(`Start: ${inv.startDate} · Paid ${inv.paidCount} of ${inv.tenureMonths} · Received ${inr(inv.receivedPaise)} · Principal outstanding ${inr(inv.outstandingPrincipalPaise)}`);
    doc.moveDown();

    const cols = [48, 80, 170, 270, 370, 460];
    const row = (cells: string[], bold = false) => {
      const y = doc.y;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      cells.forEach((c, i) => doc.text(c, cols[i]!, y, { width: (cols[i + 1] ?? 548) - cols[i]! - 6 }));
      doc.moveDown(0.4);
    };
    row(['#', 'Due', 'Interest', 'Principal', 'Payment', 'Status'], true);
    for (const s of inv.schedule) {
      if (doc.y > 760) doc.addPage();
      row([String(s.installmentNo), s.dueDate, inr(s.interestPaise), inr(s.principalPaise), inr(s.paymentPaise), s.status === 'PAID' ? `Paid ${s.txnRef ?? ''}` : s.status]);
    }
    doc.moveDown();
    doc.font('Helvetica').fontSize(8).fillColor('#66686B').text(
      'Illustrative commercial terms only. Returns and repayment of principal are not guaranteed.',
      48, doc.y, { width: 500 },
    );
    doc.end();
  });
}
