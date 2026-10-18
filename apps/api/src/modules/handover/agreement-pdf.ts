import { lateFeePerHourPaise } from '@valleyride/shared';
import { formatIST } from '../../utils/dates';
import { pdfHeader, pdfInr, pdfRow, renderPdf } from '../../utils/pdf';

export interface AgreementInput {
  bookingCode: string; rider: string; phone: string; bike: string; registrationNo: string;
  startAt: Date; endAt: Date; kmIncluded: number; extraKmPaise: number; pricePerDayPaise: number; depositPaise: number;
  odometerKm: number; damageNotes: string | null; emergencyContact: { name: string; phone: string; relationship: string };
  signedAt: Date; signaturePng: Buffer;
}

/**
 * Signed rental agreement: the key terms shown in the app at signing, the bike's recorded condition and the rider's
 * signature. The full legal text is owner-supplied; until then the terms below are the ones from the architecture document.
 */
export function agreementPdf(a: AgreementInput) {
  return renderPdf(`Rental agreement ${a.bookingCode}`, (doc) => {
    pdfHeader(doc, 'Rental agreement', `Booking ${a.bookingCode} · signed ${formatIST(a.signedAt)}`);
    pdfRow(doc, 'Rider', `${a.rider} · ${a.phone}`);
    pdfRow(doc, 'Bike', `${a.bike} · ${a.registrationNo}`);
    pdfRow(doc, 'Rental', `${formatIST(a.startAt)} to ${formatIST(a.endAt)}`);
    pdfRow(doc, 'Included', `${a.kmIncluded} km, then ${pdfInr(a.extraKmPaise)}/km + GST`);
    pdfRow(doc, 'Late return', `${pdfInr(lateFeePerHourPaise(a.pricePerDayPaise))} per started hour + GST`);
    pdfRow(doc, 'Refundable deposit', pdfInr(a.depositPaise));
    pdfRow(doc, 'Odometer at pickup', `${a.odometerKm} km`);
    pdfRow(doc, 'Emergency contact', `${a.emergencyContact.name} (${a.emergencyContact.relationship}) · ${a.emergencyContact.phone}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(11).text('Condition at pickup');
    doc.font('Helvetica').fontSize(10).text(a.damageNotes || 'No marks noted.', { width: 500 });
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(11).text('Terms');
    doc.font('Helvetica').fontSize(10).list([
      'Damage found at return is charged from the deposit after inspection; anything above the deposit is payable by the rider.',
      'Helmets for rider and pillion are compulsory.',
      'Cancellation: full rental refund more than 24 hours before pickup, 50% within 24 hours; the deposit is always refunded.',
      'The rider must hold a valid driving licence for this class of vehicle and carry it while riding.',
    ], { width: 490, bulletRadius: 1.5 });
    doc.moveDown();
    doc.font('Helvetica').fontSize(10).text('Signed by the rider:');
    doc.image(a.signaturePng, { fit: [220, 90] });
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#66686B').text('Signed electronically in the Valley Ride app. Terms are illustrative until the final agreement text is approved.');
  });
}
