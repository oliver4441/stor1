import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const affiliateSteps = [
  {
    title: 'Join the Affiliate Program',
    desc: 'Visit /affiliate and click "Join the Affiliates". Fill out the application form with your details and agree to the terms.',
    svg: `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="80" rx="8" fill="#f0f9ff"/>
      <rect x="20" y="15" width="160" height="50" rx="6" fill="#3b82f6"/>
      <text x="100" y="45" font-size="14" fill="white" text-anchor="middle" font-weight="bold">Join Affiliates</text>
      <text x="200" y="45" font-size="12" fill="#1e40af">Fill form > Submit</text>
    </svg>`
  },
  {
    title: 'Get Approved',
    desc: 'Our team reviews your application within 24-48 hours. Once approved, you get access to your affiliate dashboard.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#f0fdf4"/>
      <rect x="20" y="10" width="100" height="40" rx="6" fill="#22c55e"/>
      <text x="70" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Approved</text>
      <text x="140" y="35" font-size="11" fill="#166534">24-48 hours</text>
    </svg>`
  },
  {
    title: 'Share Your Link',
    desc: 'Copy your unique affiliate link from the dashboard. Share it on WhatsApp, social media, or your website.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#faf5ff"/>
      <rect x="20" y="10" width="120" height="40" rx="6" fill="#8b5cf6"/>
      <text x="80" y="35" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Copy Link</text>
      <text x="160" y="35" font-size="11" fill="#6b21a8">Share on WhatsApp/Social</text>
    </svg>`
  },
  {
    title: 'Earn Commissions',
    desc: 'Earn 5% (Silver) or 10% (Gold) on every qualifying sale. Track your earnings in real-time on your dashboard.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#fefce8"/>
      <rect x="20" y="10" width="100" height="40" rx="6" fill="#eab308"/>
      <text x="70" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">5-10%</text>
      <text x="140" y="35" font-size="11" fill="#854d0e">Commission per sale</text>
    </svg>`
  },
  {
    title: 'Get Paid',
    desc: 'Request payouts via M-Pesa once you reach KES 2,000 minimum. Payments processed within 48 hours.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#ecfdf5"/>
      <rect x="20" y="10" width="120" height="40" rx="6" fill="#007AFF"/>
      <text x="80" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">M-Pesa</text>
      <text x="160" y="35" font-size="11" fill="#065f46">Min KES 2,000</text>
    </svg>`
  }
];

export default function AffiliateHelp() {
  return (
    <HelpLayout title="Affiliate Program">
      <p className="mb-6 text-[#4A5771]">
        Earn commissions by promoting Omix Store products. Share your unique link and get paid for every sale you refer.
      </p>
      
      <ScreenshotGuide steps={affiliateSteps} />
      
      <h3>Tier System</h3>
      <ul>
        <li><strong>Silver (5%):</strong> Default tier for all approved affiliates</li>
        <li><strong>Gold (10%):</strong> After 30+ successful referrals</li>
      </ul>
      
      <h3>How Tracking Works</h3>
      <p>
        Your affiliate link includes a unique code. When someone clicks your link, a 100-year cookie is set.
        Any purchase they make within that period earns you a commission — even if they don't buy immediately.
      </p>
      
      <h3>Need Help?</h3>
      <p>
        Contact us via WhatsApp at 254746674392 or email omixsystems@gmail.com for affiliate support.
      </p>
    </HelpLayout>
  );
}
