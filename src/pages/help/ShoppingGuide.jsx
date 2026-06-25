import HelpLayout from './HelpLayout';

export default function ShoppingGuide() {
  return (
    <HelpLayout title="Shopping Guide">
      <h3>Browsing Products</h3>
      <p>
        Use the search bar at the top of any page to find products by name, category, or keyword.
        You can also browse categories from the navigation menu or the home page.
      </p>

      <h3>Product Details</h3>
      <p>
        Click on any product to view its details, including images, price, description, and available
        variants (size, color). If a product has variants, select your preferred options before adding
        to cart. The price may vary depending on the options you choose.
      </p>

      <h3>Adding to Cart</h3>
      <p>
        Once you have selected your preferred options, click "Add to Cart". You can continue
        shopping or proceed to checkout. Your cart is saved even if you leave the site and come
        back later.
      </p>

      <h3>Placing an Order</h3>
      <p>
        When you are ready to buy, go to your cart and click "Checkout". You will be asked to
        provide your delivery details (location, phone number) and select a payment method.
        Review your order before confirming.
      </p>

      <h3>Creating an Account</h3>
      <p>
        You can browse and add items to cart without an account, but you will need to sign up
        to place an order. Creating an account also lets you track your orders, save your
        delivery details, and manage your profile.
      </p>
    </HelpLayout>
  );
}
