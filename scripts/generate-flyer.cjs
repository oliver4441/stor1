const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const APP_URL = 'https://stor1-web.onrender.com';
const LOGO_PATH = path.join(__dirname, 'public', 'logo.svg');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'omix-install-flyer.pdf');

async function generateFlyer() {
  // Generate QR code as PNG buffer
  const qrDataUrl = await QRCode.toDataURL(APP_URL, {
    width: 300,
    margin: 2,
    color: { dark: '#ff385c', light: '#ffffff' },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  // Create PDF (A4: 595.28 x 841.89 points)
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
  });

  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  // Top accent bar
  doc.rect(0, 0, 595.28, 8).fill('#ff385c');

  // Background
  doc.rect(0, 8, 595.28, 833.89).fill('#ffffff');

  // Logo area — centered
  const logoSize = 80;
  const logoX = (595.28 - logoSize) / 2;
  try {
    // Try to embed SVG logo (PDFKit supports SVG via path)
    // Fallback: draw a rounded rect with "OMIX" text
    doc.roundedRect(logoX, 60, logoSize, logoSize, 20).fill('#1a1a2e');
    doc.fill('#667eea').font('Helvetica-Bold').fontSize(28);
    doc.text('O', logoX, 85, { width: logoSize, align: 'center' });
  } catch (e) {
    doc.roundedRect(logoX, 60, logoSize, logoSize, 20).fill('#1a1a2e');
    doc.fill('#667eea').font('Helvetica-Bold').fontSize(28);
    doc.text('O', logoX, 85, { width: logoSize, align: 'center' });
  }

  // Title
  doc.fill('#1a1a1a').font('Helvetica-Bold').fontSize(32);
  doc.text('Install Omix Store', 0, 170, { align: 'center', width: 595.28 });

  // Subtitle
  doc.fill('#666666').font('Helvetica').fontSize(14);
  doc.text('Your Online Store in Kericho. Browse products, add to cart, and pay via M-Pesa.', 60, 210, { align: 'center', width: 475 });

  // QR Code
  const qrSize = 200;
  const qrX = (595.28 - qrSize) / 2;
  doc.rect(qrX - 15, 260 - 15, qrSize + 30, qrSize + 30).fill('#ffffff').stroke('#e0e0e0');
  doc.image(qrBuffer, qrX, 260, { width: qrSize, height: qrSize });

  // Scan text
  doc.fill('#ff385c').font('Helvetica-Bold').fontSize(18);
  doc.text('Scan to Install the App', 0, 480, { align: 'center', width: 595.28 });

  // URL
  doc.fill('#999999').font('Courier').fontSize(11);
  doc.text(APP_URL, 0, 505, { align: 'center', width: 595.28 });

  // Features grid (2x2)
  const features = [
    { icon: 'BROWS', title: 'Browse Products', desc: 'Hundreds of items in stock' },
    { icon: 'CART', title: 'Easy Cart & Checkout', desc: 'Add items and pay easily' },
    { icon: 'MPESA', title: 'M-Pesa Payments', desc: 'Pay directly from your phone' },
    { icon: 'FAST', title: 'Fast Delivery', desc: 'Delivered across Kericho' },
  ];

  const cardW = 200;
  const cardH = 70;
  const gapX = 20;
  const gapY = 15;
  const gridW = cardW * 2 + gapX;
  const startX = (595.28 - gridW) / 2;
  const startY = 545;

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    // Card background
    doc.roundedRect(x, y, cardW, cardH, 10).fill('#f8f8f8');

    // Icon placeholder (colored circle)
    doc.circle(x + 25, y + cardH / 2, 15).fill('#ff385c');
    doc.fill('#ffffff').font('Helvetica-Bold').fontSize(8);
    doc.text(f.icon, x + 10, y + cardH / 2 - 4, { width: 30, align: 'center' });

    // Title
    doc.fill('#333333').font('Helvetica-Bold').fontSize(12);
    doc.text(f.title, x + 55, y + 18, { width: cardW - 65 });

    // Desc
    doc.fill('#888888').font('Helvetica').fontSize(10);
    doc.text(f.desc, x + 55, y + 36, { width: cardW - 65 });
  });

  // Footer
  doc.fill('#bbbbbb').font('Helvetica').fontSize(10);
  doc.text('Omix Store — Your Online Store in Kericho', 0, 790, { align: 'center', width: 595.28 });

  // Bottom accent bar
  doc.rect(0, 833.89, 595.28, 8).fill('#ff385c');

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log('PDF generated:', OUTPUT_PATH);
      resolve(OUTPUT_PATH);
    });
    stream.on('error', reject);
  });
}

generateFlyer().catch(console.error);
