import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const shoppingSteps = [
  {
    title: 'Browse or Search Products',
    desc: 'Use the search bar at the top of any page to find products by name, category, or keyword. Or browse categories from the navigation menu.',
    svg: `<svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
      <path d="M120 25l6 6 6-6" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="140" y="28" font-size="12" fill="#64748b">Search for anything...</text>
      <rect x="0" y="60" width="120" height="35" rx="6" fill="#ff385c"/>
      <text x="60" y="82" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Electronics</text>
      <rect x="130" y="60" width="120" height="35" rx="6" fill="#10b981"/>
      <text x="190" y="82" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Shoes</text>
      <rect x="260" y="60" width="120" height="35" rx="6" fill="#3b82f6"/>
      <text x="320" y="82" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Clothing</text>
    </svg>`
  },
  {
    title: 'View Product Details',
    desc: 'Click any product card to see full details including images, price, description, variants (size/color), and the Add to Cart button.',
    svg: `<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="120" rx="8" fill="#1e293b"/>
      <rect x="20" y="20" width="80" height="80" rx="4" fill="#334155"/>
      <text x="60" y="55" font-size="10" fill="#94a3b8" text-anchor="middle">IMAGE</text>
      <text x="120" y="35" font-size="14" fill="#f1f5f9" font-weight="bold">Product Name</text>
      <text x="120" y="55" font-size="16" fill="#ff385c">Ksh 1,299</text>
      <rect x="120" y="70" width="100" height="25" rx="4" fill="#10b981"/>
      <text x="170" y="87" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Add to Cart</text>
      <circle cx="280" cy="40" r="4" fill="#ff385c"/>
      <circle cx="295" cy="40" r="4" fill="#3b82f6"/>
      <circle cx="310" cy="40" r="4" fill="#10b981"/>
      <text x="280" y="60" font-size="10" fill="#94a3b8">Colors</text>
      <rect x="260" y="70" width="50" height="20" rx="4" fill="#334155"/>
      <text x="285" y="84" font-size="10" fill="#cbd5e1">S M L XL</text>
    </svg>`
  },
  {
    title: 'Add to Cart',
    desc: 'Select your size/color, then click "Add to Cart". Products stay in your cart even if you leave the site and return later.',
    svg: `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="80" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
      <rect x="20" y="25" width="36" height="36" rx="4" fill="#ff385c"/>
      <text x="38" y="47" font-size="12" fill="white" font-weight="bold">1</text>
      <text x="70" y="40" font-size="14" fill="#0f172a" font-weight="bold">Cart Updated</text>
      <text x="70" y="58" font-size="12" fill="#64748b">Product added successfully</text>
      <rect x="250" y="20" width="130" height="40" rx="6" fill="#ff385c"/>
      <text x="315" y="44" font-size="12" fill="white" text-anchor="middle" font-weight="bold">View Cart (1)</text>
    </svg>`
  },
  {
    title: 'Checkout',
    desc: 'Click "View Cart" then "Checkout". Enter your delivery location (Kericho town/county) and phone number. Confirm your order.',
    svg: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="140" rx="8" fill="#1e293b"/>
      <text x="20" y="30" font-size="14" fill="#f1f5f9" font-weight="bold">Delivery Details</text>
      <rect x="20" y="40" width="360" height="30" rx="4" fill="#334155"/>
      <text x="30" y="58" font-size="12" fill="#94a3b8">Kericho Town, Phone number</text>
      <text x="40" y="90" font-size="13" fill="#f1f5f9">Payment Method:</text>
      <rect x="40" y="100" width="100" height="25" rx="4" fill="#10b981"/>
      <text x="90" y="117" font-size="11" fill="white" text-anchor="middle" font-weight="bold">M-Pesa</text>
      <rect x="150" y="100" width="100" height="25" rx="4" fill="#334155"/>
      <text x="200" y="117" font-size="11" fill="#cbd5e1" text-anchor="middle">Cash on Delivery</text>
      <rect x="270" y="100" width="100" height="25" rx="4" fill="#334155"/>
      <text x="320" y="117" font-size="11" fill="#cbd5e1" text-anchor="middle">Bank Transfer</text>
      <rect x="260" y="125" width="120" height="30" rx="6" fill="#ff385c"/>
      <text x="320" y="143" font-size="13" fill="white" text-anchor="middle" font-weight="bold">Place Order</text>
    </svg>`
  }
];

export default function ShoppingGuide() {
  return (
    <HelpLayout title="Shopping Guide">
      <ScreenshotGuide steps={shoppingSteps} />
      
      <h3>Need Help?</h3>
      <p>
        If you have any questions while shopping, tap the green WhatsApp button at the bottom right
        of any page to chat with us instantly, or email omixsystems@gmail.com.
      </p>
    </HelpLayout>
  );
}