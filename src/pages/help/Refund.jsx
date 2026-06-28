import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const refundSteps = [
  {
    title: 'Request a Refund',
    desc: 'Go to your Account > Orders, find the order and click "Request Refund". Explain the issue and upload a photo if item is damaged.',
    svg: `<svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="100" rx="8" fill="#fef2f2"/>
      <rect x="20" y="20" width="120" height="60" rx="6" fill="#dc2626"/>
      <text x="80" y="50" font-size="14" fill="white" text-anchor="middle" font-weight="bold">Request Refund</text>
      <rect x="160" y="20" width="220" height="60" rx="6" fill="#fee2e2" stroke="#fecaca"/>
      <text x="180" y="40" font-size="12" fill="#7f1d1d">Reason:</text>
      <text x="180" y="58" font-size="11" fill="#991b1b">Damaged item / Wrong size</text>
      <text x="340" y="55" font-size="10" fill="#991b1b">+ Upload Photo</text>
    </svg>`
  },
  {
    title: 'Refund Processing',
    desc: 'Once approved (usually within 24 hours), refund is sent to your original payment method. M-Pesa refunds complete in 1-2 hours.',
    svg: `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="80" rx="8" fill="#f0fdf4"/>
      <rect x="40" y="15" width="80" height="50" rx="6" fill="#22c55e"/>
      <text x="80" y="45" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Approved</text>
      <path d="M130 40l15 15 40-40" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
      <rect x="180" y="15" width="100" height="50" rx="6" fill="#10b981"/>
      <text x="230" y="42" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Ksh 1,299</text>
      <text x="230" y="58" font-size="10" fill="#d1fae5" text-anchor="middle">Refunded</text>
      <text x="320" y="45" font-size="11" fill="#16a34a">1-2 hours to M-Pesa</text>
    </svg>`
  }
];

export default function Refund() {
  return (
    <HelpLayout title="How to Apply for a Refund">
      <p className="mb-6 text-zinc-400">
        We offer hassle-free refunds for eligible orders within 7 days of delivery.
      </p>
      
      <ScreenshotGuide steps={refundSteps} />
      
      <h3>Eligibility</h3>
      <ul>
        <li>Damaged or defective items</li>
        <li>Wrong item delivered</li>
        <li>Significant difference from product description</li>
        <li>Items must be unused and in original packaging</li>
      </ul>
    </HelpLayout>
  );
}