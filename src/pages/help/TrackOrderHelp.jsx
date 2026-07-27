import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const trackSteps = [
  {
    title: 'Go to Track Order',
    desc: 'Visit /track-order from any page, or find "Track Order" in your account dashboard.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#f0f9ff"/>
      <rect x="20" y="10" width="120" height="40" rx="6" fill="#71717a"/>
      <text x="80" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Track Order</text>
      <text x="160" y="35" font-size="11" fill="#52525b">/track-order</text>
    </svg>`
  },
  {
    title: 'Enter Order ID',
    desc: 'Enter your order ID (e.g., #ORD1234) in the tracking field and click "Track".',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#faf5ff"/>
      <rect x="20" y="10" width="200" height="40" rx="6" fill="#8b5cf6"/>
      <text x="120" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">#ORD1234</text>
      <text x="240" y="35" font-size="11" fill="#6b21a8">Enter order ID</text>
    </svg>`
  },
  {
    title: 'View Status',
    desc: 'See real-time status: Order Placed, Preparing, In Transit, or Delivered.',
    svg: `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="80" rx="8" fill="#f0fdf4"/>
      <rect x="20" y="15" width="80" height="50" rx="6" fill="#22c55e"/>
      <text x="60" y="45" font-size="10" fill="white" text-anchor="middle">Delivered</text>
      <rect x="120" y="15" width="80" height="50" rx="6" fill="#71717a"/>
      <text x="160" y="45" font-size="10" fill="white" text-anchor="middle">In Transit</text>
      <rect x="220" y="15" width="80" height="50" rx="6" fill="#f59e0b"/>
      <text x="260" y="45" font-size="10" fill="white" text-anchor="middle">Preparing</text>
      <rect x="320" y="15" width="60" height="50" rx="6" fill="#6b7280"/>
      <text x="350" y="45" font-size="10" fill="white" text-anchor="middle">Placed</text>
    </svg>`
  }
];

export default function TrackOrderHelp() {
  return (
    <HelpLayout title="Track Your Order">
      <p className="mb-6 text-[#4A5771]">
        Track your order status in real-time from placement to delivery.
      </p>
      
      <ScreenshotGuide steps={trackSteps} />
      
      <h3>Order Statuses</h3>
      <ul>
        <li><strong>Order Placed:</strong> We received your order</li>
        <li><strong>Preparing:</strong> Getting your items ready (1-2 hours)</li>
        <li><strong>In Transit:</strong> Rider is on the way to you</li>
        <li><strong>Delivered:</strong> Order completed</li>
      </ul>
      
      <h3>Need Help?</h3>
      <p>
        If your order seems stuck, contact us via WhatsApp at 254768213649 with your order ID.
      </p>
    </HelpLayout>
  );
}
