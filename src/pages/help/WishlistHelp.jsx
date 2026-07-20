import HelpLayout from './HelpLayout';
import ScreenshotGuide from '../../components/ScreenshotGuide';

const wishlistSteps = [
  {
    title: 'Add to Wishlist',
    desc: 'Click the heart icon on any product card or product page to save it to your wishlist.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#fef2f2"/>
      <rect x="20" y="10" width="80" height="40" rx="6" fill="#ef4444"/>
      <text x="60" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Heart</text>
      <text x="120" y="35" font-size="11" fill="#991b1b">Click to save product</text>
    </svg>`
  },
  {
    title: 'View Your Wishlist',
    desc: 'Go to /wishlist to see all saved products. Items stay saved even if you log out.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#fdf2f8"/>
      <rect x="20" y="10" width="120" height="40" rx="6" fill="#ec4899"/>
      <text x="80" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">My Wishlist</text>
      <text x="160" y="35" font-size="11" fill="#9d174d">View saved items</text>
    </svg>`
  },
  {
    title: 'Move to Cart',
    desc: 'From your wishlist, click "Add to Cart" on any item to move it to your shopping cart for checkout.',
    svg: `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg" class="w-full">
      <rect x="0" y="0" width="400" height="60" rx="8" fill="#f0fdf4"/>
      <rect x="20" y="10" width="100" height="40" rx="6" fill="#22c55e"/>
      <text x="70" y="35" font-size="12" fill="white" text-anchor="middle" font-weight="bold">Add to Cart</text>
      <text x="140" y="35" font-size="11" fill="#166534">Move item to cart</text>
    </svg>`
  }
];

export default function WishlistHelp() {
  return (
    <HelpLayout title="Wishlist">
      <p className="mb-6 text-zinc-400">
        Save products you love to your wishlist and buy them later. Your wishlist syncs across devices when logged in.
      </p>
      
      <ScreenshotGuide steps={wishlistSteps} />
      
      <h3>Features</h3>
      <ul>
        <li>Save unlimited products</li>
        <li>Syncs across all your devices</li>
        <li>Share your wishlist with friends</li>
        <li>Get notified when wishlist items go on sale</li>
      </ul>
      
      <h3>Guest Users</h3>
      <p>
        If you're not logged in, your wishlist is saved locally on your device.
        Sign up to sync your wishlist across devices and never lose saved items.
      </p>
    </HelpLayout>
  );
}
