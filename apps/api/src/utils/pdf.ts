import PDFDocument from 'pdfkit';

/** pdfkit's core fonts have no ₹ glyph, so PDFs print "Rs". */
export const pdfInr = (paise: number) => `${paise < 0 ? '-' : ''}Rs ${(Math.abs(paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Renders an A4 document to a Buffer. */
export function renderPdf(title: string, draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: title } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    draw(doc);
    doc.end();
  });
}

/** Two-column "label ..... value" row. */
export function pdfRow(doc: PDFKit.PDFDocument, label: string, value: string, bold = false) {
  const y = doc.y;
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor('#000');
  doc.text(label, 48, y, { width: 340 });
  doc.text(value, 390, y, { width: 157, align: 'right' });
  doc.moveDown(0.35);
}

export function pdfHeader(doc: PDFKit.PDFDocument, title: string, sub: string) {
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#000').text('Valley Ride', 48, 48);
  doc.font('Helvetica').fontSize(14).text(title);
  doc.fontSize(9).fillColor('#66686B').text(sub);
  doc.moveDown();
  doc.fillColor('#000');
}
