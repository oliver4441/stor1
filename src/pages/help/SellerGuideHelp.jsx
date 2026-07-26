import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const sellerSteps = [
  {
    title: 'Register as Seller',
    desc: 'Visit /seller/register and fill out the seller application form with your business details.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#f0f9ff"/>
      <rect x="20" y="10" width="140" height="40" rx="6" fill="#71717a"/>
      <text x="90" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Register Seller</text>
      <text x="180" y="35" font-size="11" fill="#52525b">/seller/register</text>
    </svg>`
  },
  {
    title: 'Get Approved',
    desc: 'Our team reviews your application. Once approved, you get access to your seller dashboard.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#f0fdf4"/>
      <rect x="20" y="10" width="100" height="40" rx="6" fill="#22c55e"/>
      <text x="70" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Approved</text>
      <text x="140" y="35" font-size="11" fill="#166534">Access dashboard</text>
    </svg>`
  },
  {
    title: 'List Products',
    desc: 'Add products with images, descriptions, prices, and variants (size/color). Set your inventory.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#faf5ff"/>
      <rect x="20" y="10" width="120" height="40" rx="6" fill="#8b5cf6"/>
      <text x="80" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Add Products</text>
      <text x="160" y="35" font-size="11" fill="#6b21a8">Images + details</text>
    </svg>`
  },
  {
    title: 'Manage Orders',
    desc: 'View and fulfill orders from your seller dashboard. Update order status as you ship.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#fefce8"/>
      <rect x="20" y="10" width="100" height="40" rx="6" fill="#eab308"/>
      <text x="70" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Orders</text>
      <text x="140" y="35" font-size="11" fill="#854d0e">Manage & fulfill</text>
    </svg>`
  },
  {
    title: 'Get Paid',
    desc: 'Receive payouts for completed orders. Payments processed weekly via M-Pesa.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#ecfdf5"/>
      <rect x="20" y="10" width="100" height="40" rx="6" fill="#71717a"/>
      <text x="70" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Payout</text>
      <text x="140" y="35" font-size="11" fill="#065f46">Weekly via M-Pesa</text>
    </svg>`
  }
];

export default function SellerGuideHelp() {
  return (
    <HelpLayout title="Seller Guide">
      <p className="mb-6 text-[#4A5771]">
        Sell your products on Omix Store and reach customers across Kenya.
      </p>
      
      <ScreenshotGuide steps={sellerSteps} />
      
      <h3>Requirements</h3>
      <ul>
        <li>Valid business registration or ID</li>
        <li>Product images (clear, well-lit)</li>
        <li>Accurate product descriptions</li>
        <li>Reliable delivery method</li>
      </ul>
      
      <h3>Fees</h3>
      <p>
        Omix Store charges a small commission on completed sales. No listing fees or monthly charges.
      </p>
      
      <h3>Need Help?</h3>
      <p>
        Contact us via WhatsApp at 254746674392 or email omixsystems@gmail.com for seller support.
      </p>
    </HelpLayout>
  );
}
