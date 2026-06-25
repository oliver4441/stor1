import HelpLayout from './HelpLayout';

export default function DisputeResolution() {
  return (
    <HelpLayout title="Dispute Resolution Policy">
      <h3>How Disputes Work</h3>
      <p>
        If you receive a damaged item, wrong product, or have any issue with your order,
        follow this 4-step process:
      </p>

      <ol>
        <li>Contact us within 48 hours of delivery via WhatsApp or email</li>
        <li>Provide your order number and clear photos of the issue</li>
        <li>Our team investigates and offers a solution within 24 hours</li>
        <li>Accept the solution or escalate to dispute mediation</li>
      </ol>

      <h3>Common Solutions</h3>
      <ul>
        <li>Full refund to original payment method</li>
        <li>Replacement of the item</li>
        <li>Partial refund for minor issues</li>
        <li>Coupon for future purchase</li>
      </ul>

      <h3>Mediation</h3>
      <p>
        If you disagree with our initial resolution, we can arrange independent mediation
        through Kericho Consumer Affairs or a neutral third party.
      </p>
    </HelpLayout>
  );
}