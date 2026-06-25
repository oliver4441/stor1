import HelpLayout from './HelpLayout';

export default function Refund() {
  return (
    <HelpLayout title="How to Apply for a Refund">
      <h3>Refund Eligibility</h3>
      <p>
        You may be eligible for a refund if:
      </p>
      <ul>
        <li>The item arrived damaged or defective</li>
        <li>The item does not match the description or images on the listing</li>
        <li>You received the wrong item or size</li>
        <li>The item was not delivered within the stated delivery time</li>
      </ul>

      <h3>How to Request a Refund</h3>
      <p>Follow these steps to apply for a refund:</p>
      <ol>
        <li>Go to your account and open the order you want to refund</li>
        <li>Click "Request Refund" and select the reason</li>
        <li>Provide clear photos showing the issue (for damaged or wrong items)</li>
        <li>Submit your request</li>
      </ol>

      <h3>Processing Time</h3>
      <p>
        Refund requests are reviewed within 2-3 business days. If approved, the refund will
        be processed to your original payment method within 5-7 business days. For M-Pesa
        payments, refunds are sent back to your M-Pesa number.
      </p>

      <h3>What is Not Covered</h3>
      <ul>
        <li>Change of mind after purchase</li>
        <li>Damage caused by misuse or improper handling</li>
        <li>Items returned without prior approval</li>
        <li>Products listed as final sale or clearance</li>
      </ul>
    </HelpLayout>
  );
}
