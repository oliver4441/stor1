import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const faqSteps = [
  {
    title: 'Do I need an account to shop?',
    desc: 'No. You can browse and add items to cart without an account. But you need to sign up to place an order.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="40" y="38" font-size="14" fill="#0f172a">Browse &gt; Add to Cart &gt;</text>
      <rect x="180" y="15" width="90" height="30" rx="6" fill="#1a5632"/>
      <text x="225" y="34" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Sign Up</text>
      <text x="300" y="38" font-size="14" fill="#0f172a">to Order</text>
    </svg>`
  },
  {
    title: 'What payment methods do you accept?',
    desc: 'M-Pesa STK push is our main method. We also accept Paybill, Bank Transfer, and Cash on Delivery in Kericho town.',
    svg: `<svg viewBox="0 0 400 70" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="70" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
      <rect x="20" y="15" width="80" height="40" rx="6" fill="#10b981"/>
      <text x="60" y="38" font-size="10" fill="white" text-anchor="middle" font-weight="bold">M-Pesa</text>
      <rect x="110" y="15" width="80" height="40" rx="6" fill="#3b82f6"/>
      <text x="150" y="38" font-size="10" fill="white" text-anchor="middle" font-weight="bold">Paybill</text>
      <rect x="200" y="15" width="80" height="40" rx="6" fill="#f59e0b"/>
      <text x="240" y="38" font-size="10" fill="white" text-anchor="middle" font-weight="bold">Bank</text>
      <rect x="290" y="15" width="80" height="40" rx="6" fill="#8b5cf6"/>
      <text x="330" y="38" font-size="10" fill="white" text-anchor="middle" font-weight="bold">COD</text>
    </svg>`
  },
  {
    title: 'How do I track my order?',
    desc: 'Log in to your account, go to Order History, and click any order to see status (Preparing, In Transit, Delivered).',
    svg: `<svg viewBox="0 0 400 70" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="70" rx="8" fill="#ecfdf5"/>
      <rect x="20" y="15" width="100" height="40" rx="6" fill="#22c55e"/>
      <text x="70" y="38" font-size="10" fill="white" text-anchor="middle">Delivered</text>
      <rect x="130" y="15" width="100" height="40" rx="6" fill="#3b82f6"/>
      <text x="180" y="38" font-size="10" fill="white" text-anchor="middle">In Transit</text>
      <rect x="240" y="15" width="100" height="40" rx="6" fill="#f59e0b"/>
      <text x="290" y="38" font-size="10" fill="white" text-anchor="middle">Preparing</text>
    </svg>`
  }
];

export default function FAQ() {
  return (
    <HelpLayout title="FAQ Center">
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">Quick answers to the most common questions.</p>
      
      <ScreenshotGuide steps={faqSteps} />
      
      <h3>More Questions?</h3>
      <p>
        If you cannot find your answer here, contact us via WhatsApp at 254768213649
        or email omixsystems@gmail.com. We respond within 24 hours.
      </p>
    </HelpLayout>
  );
}