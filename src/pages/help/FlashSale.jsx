import HelpLayout from './HelpLayout';
import { Link } from 'react-router-dom';

export default function FlashSale() {
  return (
    <HelpLayout title="Flash Sale">
      <h3>What is a Flash Sale?</h3>
      <p>
        A Flash Sale is a limited-time promotion where select products are offered at
        significantly discounted prices. Flash Sales run for a few hours or until stock
        runs out, whichever comes first.
      </p>

      <h3>How to Participate</h3>
      <ol>
        <li>Browse the Flash Sale section on the home page or visit the Flash Sale page</li>
        <li>Add items to your cart quickly — stock is limited</li>
        <li>Proceed to checkout and complete payment</li>
        <li>Orders are processed on a first-come, first-served basis</li>
      </ol>

      <h3>Flash Sale Rules</h3>
      <ul>
        <li>Each customer may purchase a maximum quantity as stated on the product page</li>
        <li>Flash Sale prices are valid only while the sale is active</li>
        <li>Standard delivery timelines apply to Flash Sale orders</li>
        <li>Flash Sale items are final sale unless they arrive damaged or defective</li>
        <li>Discounts cannot be combined with other promotions or coupon codes</li>
      </ul>

      <h3>Tips to Win</h3>
      <ul>
        <li>Create an account and save your delivery details in advance</li>
        <li>Enable notifications so you never miss a Flash Sale announcement</li>
        <li>Have your M-Pesa ready for quick checkout</li>
        <li>Check the countdown timer to know how much time is left</li>
      </ul>

      <h3>Stay Updated</h3>
      <p>
        Follow us on social media and enable push notifications to get alerted when a new
        Flash Sale starts. You can also check the home page for active Flash Sale banners.
      </p>

      <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#ff385c] font-bold text-sm hover:underline"
        >
          Browse current deals
        </Link>
      </div>
    </HelpLayout>
  );
}
