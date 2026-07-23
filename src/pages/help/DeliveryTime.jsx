import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const deliveryTimeSteps = [
  {
    title: 'Orders Within Major Cities',
    desc: 'Same-day or next-day delivery. Orders placed before 2 PM get delivered same day. After 2 PM, delivery is next day.',
    svg: `<svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="100" rx="8" fill="#eff6ff"/>
      <rect x="20" y="20" width="160" height="60" rx="6" fill="#3b82f6"/>
      <text x="100" y="45" font-size="14" fill="white" text-anchor="middle" font-weight="bold">Nairobi / Mombasa / Kisumu</text>
      <text x="100" y="65" font-size="12" fill="white" text-anchor="middle">Same day / Next day</text>
      <rect x="200" y="20" width="180" height="60" rx="6" fill="#dbeafe"/>
      <text x="290" y="45" font-size="11" fill="#1e40af">2 PM cutoff for same day</text>
      <text x="290" y="65" font-size="11" fill="#1e40af">After 2 PM = next day</text>
    </svg>`
  },
  {
    title: 'Orders Outside Nairobi / Mombasa / Kisumu',
    desc: '3-7 business days depending on your location. We partner with local courier services for county-wide delivery.',
    svg: `<svg viewBox="00 0 400 120" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="120" rx="8" fill="#fff7ed"/>
      <rect x="20" y="20" width="360" height="80" rx="6" fill="#f97316"/>
      <text x="200" y="45" font-size="14" fill="white" text-anchor="middle" font-weight="bold">Upcountry Delivery</text>
      <text x="200" y="65" font-size="12" fill="white" text-anchor="middle">3-7 business days</text>
      <text x="200" y="88" font-size="11" fill="#fed7aa" text-anchor="middle">Bomet, Kakamega, Eldoret, Nairobi, Mombasa</text>
    </svg>`
  },
  {
    title: 'Track Your Order',
    desc: 'Log in to your account to see order status updates. You will also receive SMS notifications on delivery progress.',
    svg: `<svg viewBox="0 0 400 90" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="90" rx="8" fill="#f3e8ff"/>
      <rect x="20" y="15" width="120" height="60" rx="6" fill="#8b5cf6"/>
      <text x="80" y="40" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Preparing</text>
      <rect x="140" y="15" width="120" height="60" rx="6" fill="#3b82f6"/>
      <text x="200" y="40" font-size="12" fill="white" text-anchor="middle" font-weight="bold">In Transit</text>
      <rect x="260" y="15" width="120" height="60" rx="6" fill="#10b981"/>
      <text x="320" y="40" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Delivered</text>
    </svg>`
  }
];

export default function DeliveryTime() {
  return (
    <HelpLayout title="How Long Does My Order Arrive">
      <p className="mb-6 text-zinc-400">
        Delivery times depend on your location and order time.
      </p>
      
      <ScreenshotGuide steps={deliveryTimeSteps} />
    </HelpLayout>
  );
}