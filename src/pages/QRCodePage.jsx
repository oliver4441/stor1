import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const APP_URL = 'https://stor1-web.onrender.com';

export default function QRCodePage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, APP_URL, {
        width: 300,
        margin: 2,
        color: {
          dark: '#71717a',
          light: '#ffffff',
        },
      });
    }
  }, []);

  const handleDownloadPDF = () => {
    // Open print dialog for the flyer
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Install Omix Store — QR Code</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f5f5;
          }
          .flyer {
            width: 210mm;
            min-height: 297mm;
            background: white;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .flyer::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 8px;
            background: linear-gradient(90deg, #71717a, #71717a),
          }
          .logo {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            background: linear-gradient(90deg, #71717a, #71717a),
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            box-shadow: 0 8px 30px rgba(255, 56, 92, 0.3);
          }
          .logo span {
            color: white;
            font-size: 36px;
            font-weight: 900;
          }
          h1 {
            font-size: 32px;
            font-weight: 900;
            color: #1a1a1a;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 32px;
            max-width: 400px;
            line-height: 1.5;
          }
          .qr-container {
            background: white;
            padding: 20px;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            margin-bottom: 24px;
            border: 2px solid #f0f0f0;
          }
          .qr-container canvas {
            display: block;
          }
          .scan-text {
            font-size: 18px;
            font-weight: 700;
            color: #71717a;
            margin-bottom: 8px;
          }
          .url {
            font-size: 14px;
            color: #999;
            font-family: monospace;
            margin-bottom: 32px;
          }
          .features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            width: 100%;
            max-width: 400px;
            margin-bottom: 32px;
          }
          .feature {
            background: #f8f8f8;
            padding: 16px;
            border-radius: 12px;
            text-align: left;
          }
          .feature-icon {
            font-size: 20px;
            margin-bottom: 6px;
          }
          .feature-title {
            font-size: 13px;
            font-weight: 700;
            color: #333;
          }
          .feature-desc {
            font-size: 11px;
            color: #888;
            margin-top: 2px;
          }
          .footer {
            position: absolute;
            bottom: 24px;
            font-size: 12px;
            color: #bbb;
          }
          @media print {
            body { background: white; }
            .flyer { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="flyer">
          <div class="logo"><img src="${APP_URL}/logo.svg" alt="Omix" width="80" height="80" /></div>
          <h1>Install Omix Store</h1>
          <p class="subtitle">Omix - Browse products, add to cart, and pay via M-Pesa.</p>
          <div class="qr-container">
            <canvas id="qr-canvas"></canvas>
          </div>
          <p class="scan-text">Scan to Install the App</p>
          <p class="url">${APP_URL}</p>
          <div class="features">
            <div class="feature">
              <div class="feature-icon">BROWS</div>
              <div class="feature-title">Browse Products</div>
              <div class="feature-desc">Hundreds of items in stock</div>
            </div>
            <div class="feature">
              <div class="feature-icon">CART</div>
              <div class="feature-title">Easy Cart & Checkout</div>
              <div class="feature-desc">Add items and pay easily</div>
            </div>
            <div class="feature">
              <div class="feature-icon">MPESA</div>
              <div class="feature-title">M-Pesa Payments</div>
              <div class="feature-desc">Pay directly from your phone</div>
            </div>
            <div class="feature">
              <div class="feature-icon">FAST</div>
              <div class="feature-title">Fast Delivery</div>
              <div class="feature-desc">Delivered across Kenya</div>
            </div>
          </div>
          <p class="footer">Omix Store — Kenya Online Marketplace</p>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        <script>
          QRCode.toCanvas(document.getElementById('qr-canvas'), '${APP_URL}', {
            width: 250,
            margin: 2,
            color: { dark: '#71717a', light: '#ffffff' }
          }, function() {
            setTimeout(function() { window.print(); }, 500);
          });
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-[#242C3B] dark:to-[#28303F] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="w-20 h-20 rounded-3xl overflow-hidden mb-6 shadow-2xl shadow-[var(--seasonal-primary,#71717a)]/30">
        <img src="/logo.svg" alt="Omix" className="w-full h-full" />
      </div>

      <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight text-center">
        Install Omix Store
      </h1>
      <p className="text-[#4A5771] mb-8 text-center max-w-md">
        Scan this QR code with your phone camera to install the Omix app on your device.
      </p>

      {/* QR Code */}
      <div className="bg-white p-6 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-[#353F54] mb-6">
        <canvas ref={canvasRef} className="block"></canvas>
      </div>

      <p className="text-sm font-bold text-[var(--seasonal-primary,#71717a)] mb-1">Scan to Install the App</p>
      <p className="text-xs text-[#4A5771] font-mono mb-8">{APP_URL}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={handleDownloadPDF}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--seasonal-primary,#71717a)] to-[var(--seasonal-secondary,#71717a)] text-white px-6 py-3.5 rounded-2xl font-black shadow-xl shadow-[var(--seasonal-primary,#71717a)]/25 hover:shadow-[var(--seasonal-primary,#71717a)]/40 transition-all hover:scale-105 active:scale-95 text-sm"
        >
          Download Print Flyer
        </button>
        <a
          href="/install"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-[#8E9BB5] bg-[#28303F] hover:bg-[#353F54] transition-all text-sm"
        >
          Install Directly
        </a>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 mt-10 max-w-md w-full">
        {[
          { title: 'Browse Products', desc: 'Hundreds of items' },
          { title: 'M-Pesa Payments', desc: 'Pay from your phone' },
          { title: 'Fast Delivery', desc: 'Across Kenya' },
          { title: 'Full Screen App', desc: 'Works like native' },
        ].map((f, i) => (
          <div key={i} className="bg-[#28303F] rounded-xl p-4 text-center border border-zinc-100 dark:border-[#353F54]">
            <h3 className="font-bold text-white text-sm">{f.title}</h3>
            <p className="text-xs text-[#4A5771] mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
