import HelpLayout from './HelpLayout';

export default function AfterSale() {
  return (
    <HelpLayout title="After Sale Policy">
      <h3>Post-Purchase Support</h3>
      <p>
        After you receive your order, we are here to help. If you experience any issues with
        your purchase, contact us within 7 days of delivery for assistance.
      </p>

      <h3>Warranty</h3>
      <p>
        All products sold on Omix Store come with a minimum 7-day warranty against manufacturing
        defects. Some products may have extended warranties as stated in their listing.
        Warranty covers:
      </p>
      <ul>
        <li>Manufacturing defects</li>
        <li>Functional failure under normal use</li>
        <li>Missing parts or accessories</li>
      </ul>
      <p>
        Warranty does not cover damage from misuse, unauthorized repairs, or normal wear and tear.
      </p>

      <h3>Returns</h3>
      <p>
        You may return a product within 7 days of delivery if it is defective, damaged, or
        not as described. To initiate a return:
      </p>
      <ol>
        <li>Contact us through your order page</li>
        <li>Provide photos showing the issue</li>
        <li>We will arrange for pickup or provide a return address</li>
        <li>Once the item is received and inspected, we will process your refund or replacement</li>
      </ol>

      <h3>Exchanges</h3>
      <p>
        If you received the wrong size or color, we can arrange an exchange subject to
        availability. Contact us within 3 days of delivery to request an exchange.
      </p>
    </HelpLayout>
  );
}
