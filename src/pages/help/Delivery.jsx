import HelpLayout from './HelpLayout';

export default function Delivery() {
  return (
    <HelpLayout title="Delivery and Shipping">
      <h3>Delivery Coverage</h3>
      <p>
        We deliver to all 47 counties in Kenya. Delivery times and rates vary depending on
        your location.
      </p>

      <h3>Delivery Areas and Timelines</h3>
      <ul>
        <li>
          <strong>Kericho Town</strong> — Same-day or next-day delivery for orders placed
          before 3 PM
        </li>
        <li>
          <strong>Kericho County</strong> — 1-2 business days
        </li>
        <li>
          <strong>Nairobi, Nakuru, Kisumu, Eldoret</strong> — 2-4 business days
        </li>
        <li>
          <strong>Other Counties</strong> — 3-7 business days depending on location
        </li>
      </ul>

      <h3>Shipping Rates</h3>
      <p>
        Shipping costs are calculated at checkout based on your delivery location and the
        weight of your items. We offer free delivery on orders above a certain amount
        (promotional periods may apply).
      </p>

      <h3>Delivery Process</h3>
      <ol>
        <li>Once your order is confirmed and payment is verified, we begin processing</li>
        <li>You will receive a confirmation message with your order details</li>
        <li>When your order is dispatched, you will get a tracking update</li>
        <li>Our delivery agent will contact you before arrival</li>
        <li>Receive your order and confirm satisfaction</li>
      </ol>

      <h3>Pickup Option</h3>
      <p>
        You can also choose to pick up your order from our location in Kericho. Select
        "Pickup" at checkout and we will notify you when your order is ready.
      </p>
    </HelpLayout>
  );
}
