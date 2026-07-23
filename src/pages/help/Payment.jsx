import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const paymentSteps = [
  {
    title: 'M-Pesa (Recommended)',
    desc: 'Select M-Pesa, enter your phone number, confirm the STK prompt with your PIN, and receive instant order confirmation.',
    svg: `<svg viewBox="0 0 400 160" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="160" rx="8" fill="#1e293b"/>
      <text x="20" y="30" font-size="14" fill="#f1f5f9" font-weight="bold">M-Pesa Checkout</text>
      <rect x="20" y="40" width="360" height="40" rx="4" fill="#334155"/>
      <text x="30" y="62" font-size="12" fill="#94a3b8">Phone: 07XXXXXXXX</text>
      <rect x="20" y="90" width="360" height="40" rx="4" fill="#10b981"/>
      <text x="200" y="114" font-size="13" fill="white" text-anchor="middle" font-weight="bold">Pay Ksh 1,299</text>
      <text x="200" y="135" font-size="10" fill="#94a3b8" text-anchor="middle">Enter M-Pesa PIN when prompt appears</text>
      <!-- Phone notification -->
      <rect x="280" y="10" width="110" height="60" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="335" y="25" font-size="9" fill="#f1f5f9" text-anchor="middle">Safaricom</text>
      <text x="335" y="40" font-size="10" fill="#f1f5f9" text-anchor="middle">Confirm KES 1,299</text>
      <text x="335" y="52" font-size="9" fill="#94a3b8" text-anchor="middle">Enter PIN > _____</text>
    </svg>`
  },
  {
    title: 'Paybill Option',
    desc: 'Go to M-Pesa > Paybill, enter our business number, your order number as account, amount, and confirm with PIN.',
    svg: `<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="120" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
      <text x="20" y="25" font-size="12" fill="#0f172a" font-weight="bold">M-Pesa Menu</text>
      <rect x="20" y="35" width="120" height="30" rx="4" fill="#10b981"/>
      <text x="80" y="53" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Paybill</text>
      <rect x="150" y="35" width="120" height="30" rx="4" fill="#334155"/>
      <text x="210" y="53" font-size="12" fill="#cbd5e1" text-anchor="middle">Buy Goods</text>
      <rect x="20" y="75" width="360" height="35" rx="4" fill="#ffffff"/>
      <text x="60" y="95" font-size="11" fill="#0f172a">Biz No: 4XXXXXXX</text>
      <text x="180" y="95" font-size="11" fill="#0f172a">Acc: #ORD1234</text>
      <text x="280" y="95" font-size="11" fill="#0f172a">Ksh 1,299</text>
    </svg>`
  },
  {
    title: 'Cash on Delivery',
    desc: 'Available for cash on delivery orders nationwide.',
    svg: `<svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="100" rx="8" fill="#ecfdf5"/>
      <rect x="20" y="20" width="360" height="60" rx="6" fill="#10b981"/>
      <text x="200" y="50" font-size="14" fill="white" text-anchor="middle" font-weight="bold">Cash on Delivery</text>
      <text x="200" y="72" font-size="11" fill="white" text-anchor="middle">Available Nationwide</text>
      <text x="200" y="35" font-size="12" fill="white" text-anchor="middle">+ Ksh 50 convenience fee</text>
    </svg>`
  }
];

export default function Payment() {
  return (
    <HelpLayout title="How Do I Pay on Omix Store">
      <p className="mb-6 text-zinc-400">
        We accept multiple payment methods to make checkout as convenient as possible.
      </p>
      
      <ScreenshotGuide steps={paymentSteps} />
      
      <h3>After Payment</h3>
      <p>
        Once your payment is confirmed, you will receive an order confirmation on WhatsApp or email.
        Your order will be prepared for delivery and you can track its status in your account dashboard.
      </p>
    </HelpLayout>
  );
}