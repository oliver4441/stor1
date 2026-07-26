import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const flashSaleSteps = [
  {
    title: 'What Are Flash Sales?',
    desc: 'Limited-time deals where selected products are heavily discounted for a short period. Usually 24-48 hours.',
    svg: `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="80" rx="8" fill="#fef2f2"/>
      <rect x="20" y="15" width="120" height="50" rx="6" fill="#dc2626"/>
      <text x="80" y="42" font-size="14" fill="white" text-anchor="middle" font-weight="bold">FLASH SALE</text>
      <text x="80" y="58" font-size="10" fill="#fecaca" text-anchor="middle">24-48 hours</text>
      <rect x="160" y="15" width="100" height="50" rx="6" fill="#fee2e2"/>
      <text x="210" y="40" font-size="28" fill="#dc2626" text-anchor="middle" font-weight="bold">50%</text>
      <text x="210" y="58" font-size="10" fill="#ea580c" text-anchor="middle">OFF</text>
      <rect x="280" y="15" width="100" height="50" rx="6" fill="#eff6ff"/>
      <text x="330" y="40" font-size="12" fill="#71717a" text-anchor="middle" font-weight="bold">5 left</text>
      <text x="330" y="58" font-size="10" fill="#64748b" text-anchor="middle">Hurry!</text>
    </svg>`
  },
  {
    title: 'How to Get Flash Sale Items',
    desc: 'Spot the red "FLASH SALE" badge on products. Add to cart immediately and checkout within 2 hours to guarantee the discount.',
    svg: `<svg viewBox="0 0 400 90" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="90" rx="8" fill="#fffbeb"/>
      <rect x="20" y="15" width="360" height="60" rx="6" fill="#fef3c7" stroke="#fbbf24"/>
      <rect x="30" y="25" width="60" height="40" rx="4" fill="#f59e0b"/>
      <text x="60" y="48" font-size="10" fill="white" text-anchor="middle" font-weight="bold">NEW</text>
      <rect x="100" y="25" width="70" height="40" rx="4" fill="#dc2626"/>
      <text x="135" y="48" font-size="9" fill="white" text-anchor="middle" font-weight="bold">FLASH SALE</text>
      <text x="180" y="50" font-size="14" fill="#0f172a" font-weight="bold">Product Name</text>
      <text x="320" y="50" font-size="12" fill="#ea580c" font-weight="bold">Ksh 999</text>
      <text x="340" y="65" font-size="10" fill="#94a3b8" style="text-decoration:line-through">Ksh 1,999</text>
      <rect x="270" y="55" width="95" height="25" rx="6" fill="#1a5632"/>
      <text x="317" y="71" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Add to Cart</text>
    </svg>`
  }
];

export default function FlashSale() {
  return (
    <HelpLayout title="Flash Sale">
      <p className="mb-6 text-zinc-400">
        Grab incredible deals before they are gone.
      </p>
      
      <ScreenshotGuide steps={flashSaleSteps} />
    </HelpLayout>
  );
}