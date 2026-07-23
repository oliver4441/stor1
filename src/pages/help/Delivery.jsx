import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const deliverySteps = [
  {
    title: 'Delivery Process',
    desc: 'After payment confirmation, we prepare your order. Delivery timelines depend on your location.',
    svg: `<svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="100" rx="8" fill="#f0f9ff"/>
      <rect x="20" y="20" width="80" height="60" rx="6" fill="#0ea5e9"/>
      <text x="60" y="45" font-size="12" fill="white" text-anchor="middle">Prep</text>
      <text x="60" y="62" font-size="10" fill="#bae6fd" text-anchor="middle">2 hours</text>
      <path d="M100 50l30 0" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4"/>
      <rect x="140" y="20" width="80" height="60" rx="6" fill="#3b82f6"/>
      <text x="180" y="45" font-size="12" fill="white" text-anchor="middle">Pick Up</text>
      <text x="180" y="62" font-size="10" fill="#bfdbfe" text-anchor="middle">Rider</text>
      <path d="M220 50l30 0" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4"/>
      <rect x="260" y="20" width="80" height="60" rx="6" fill="#10b981"/>
      <text x="300" y="45" font-size="12" fill="white" text-anchor="middle">Deliver</text>
      <text x="300" y="62" font-size="10" fill="#d1fae5" text-anchor="middle">Kenya</text>
    </svg>`
  },
  {
    title: 'Shipping Rates',
    desc: 'Delivery is free on eligible orders. Other locations have a flat rate depending on distance.',
    svg: `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="80" rx="8" fill="#ecfdf5"/>
      <rect x="20" y="15" width="120" height="50" rx="6" fill="#10b981"/>
      <text x="80" y="40" font-size="14" fill="white" text-anchor="middle" font-weight="bold">FREE</text>
      <text x="80" y="58" font-size="10" fill="#d1fae5" text-anchor="middle">Free Delivery</text>
      <rect x="160" y="15" width="120" height="50" rx="6" fill="#3b82f6"/>
      <text x="220" y="40" font-size="14" fill="white" text-anchor="middle" font-weight="bold">Ksh 150</text>
      <text x="220" y="58" font-size="10" fill="#bfdbfe" text-anchor="middle">County</text>
      <rect x="300" y="15" width="80" height="50" rx="6" fill="#f59e0b"/>
      <text x="340" y="40" font-size="14" fill="white" text-anchor="middle" font-weight="bold">Ksh 300</text>
      <text x="340" y="58" font-size="10" fill="#fef3c7" text-anchor="middle">Upcountry</text>
    </svg>`
  }
];

export default function Delivery() {
  return (
    <HelpLayout title="Delivery and Shipping">
      <p className="mb-6 text-zinc-400">
        We deliver across Kenya.
      </p>
      
      <ScreenshotGuide steps={deliverySteps} />
    </HelpLayout>
  );
}