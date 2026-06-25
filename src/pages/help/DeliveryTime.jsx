import HelpLayout from './HelpLayout';

export default function DeliveryTime() {
  return (
    <HelpLayout title="How Long Does My Order Arrive">
      <h3>Estimated Delivery Times</h3>
      <p>
        Delivery times vary based on your location and the product availability. Below are
        general estimates:
      </p>

      <h4>Kericho Town</h4>
      <p>
        Orders placed before 3 PM are delivered the same day. Orders placed after 3 PM are
        delivered the next day.
      </p>

      <h4>Kericho County (Outside Town)</h4>
      <p>
        Delivery takes 1-2 business days. We consolidate deliveries to nearby areas on
        specific days of the week.
      </p>

      <h4>Major Cities (Nairobi, Nakuru, Kisumu, Eldoret)</h4>
      <p>
        Delivery takes 2-4 business days via our partner courier services.
      </p>

      <h4>Other Counties</h4>
      <p>
        Delivery takes 3-7 business days depending on the location and road accessibility.
      </p>

      <h3>Factors That May Affect Delivery</h3>
      <ul>
        <li>Product availability — items may need to be sourced from suppliers</li>
        <li>Weather conditions and road accessibility</li>
        <li>Public holidays and peak shopping seasons</li>
        <li>Accuracy of the delivery address provided</li>
      </ul>

      <h3>Order Tracking</h3>
      <p>
        Once your order is dispatched, you will receive a message with tracking information.
        You can also check your order status anytime in your account dashboard under "My Orders".
      </p>

      <h3>Delayed Orders</h3>
      <p>
        If your order has not arrived within the estimated timeframe, please contact us via
        WhatsApp or email. We will investigate and provide an update within 24 hours.
      </p>
    </HelpLayout>
  );
}
