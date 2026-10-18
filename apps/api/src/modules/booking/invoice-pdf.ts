import { formatIST } from '../../utils/dates';
import { pdfHeader, pdfInr, pdfRow, renderPdf } from '../../utils/pdf';
import type { invoiceFor } from './booking.invoice';

type Invoice = Awaited<ReturnType<typeof invoiceFor>>;
const ph = (v: string | null, label: string) => v ?? `[${label}]`;

/** Tax invoice PDF from the same data as GET /bookings/:id/invoice. Owner-supplied fields print as placeholders. */
export function invoicePdf(inv: Invoice) {
  return renderPdf(`Invoice ${inv.number}`, (doc) => {
    pdfHeader(doc, inv.final ? 'Tax invoice' : 'Booking invoice', `${inv.number} · issued ${formatIST(new Date(inv.issuedAt), { dateStyle: 'medium' })}`);
    doc.fontSize(9).fillColor('#66686B').text(`GSTIN ${ph(inv.seller.gstin, 'your GSTIN')} · ${ph(inv.seller.address, 'Registered business address')}`);
    doc.moveDown();
    doc.fillColor('#000');
    pdfRow(doc, 'Billed to', `${inv.billedTo.name ?? ''} · ${inv.billedTo.phone ?? ''}`);
    pdfRow(doc, 'Booking', inv.bookingCode);
    doc.moveDown();
    pdfRow(doc, `Item · SAC ${ph(inv.seller.sac, 'code')}`, 'Amount', true);
    for (const l of inv.lines) pdfRow(doc, l.label, pdfInr(l.amountPaise));
    doc.moveDown(0.3);
    pdfRow(doc, 'Taxable value', pdfInr(inv.taxablePaise));
    pdfRow(doc, `CGST ${inv.gstPct / 2}%`, pdfInr(inv.cgstPaise));
    pdfRow(doc, `SGST ${inv.gstPct / 2}%`, pdfInr(inv.sgstPaise));
    pdfRow(doc, 'Total', pdfInr(inv.totalPaise), true);
    doc.moveDown();
    doc.font('Helvetica').fontSize(9).fillColor('#66686B').text(
      `The ${pdfInr(inv.depositPaise)} refundable deposit is not part of this invoice.${inv.final ? '' : ' Extra km and late fees, if any, are added after the return.'}`, 48, doc.y, { width: 500 });
  });
}
