import HelpLayout from './HelpLayout';

export default function DisputeResolution() {
  return (
    <HelpLayout title="Dispute Resolution Policy">
      <h3>Our Commitment</h3>
      <p>
        Omix Store is committed to fair and timely resolution of any disputes between buyers
        and sellers. We aim to mediate and resolve all issues within 7 business days.
      </p>

      <h3>Dispute Process</h3>
      <ol>
        <li>
          <strong>Contact the Seller First</strong> — Most issues can be resolved by communicating
          directly with the seller through your order page
        </li>
        <li>
          <strong>Escalate to Omix</strong> — If you cannot reach an agreement with the seller
          within 3 days, escalate the dispute to Omix Store support
        </li>
        <li>
          <strong>Investigation</strong> — Our team will review all evidence including
          photos, messages, and order details
        </li>
        <li>
          <strong>Resolution</strong> — We will issue a final decision and take appropriate
          action, which may include a refund, replacement, or store credit
        </li>
      </ol>

      <h3>Evidence Requirements</h3>
      <p>
        To help us resolve your dispute quickly, please provide:
      </p>
      <ul>
        <li>Clear photos or video of the issue (if applicable)</li>
        <li>Copies of any communication with the seller</li>
        <li>Your order number and date of purchase</li>
        <li>Any receipts or payment confirmations</li>
      </ul>

      <h3>Appeals</h3>
      <p>
        If you disagree with the resolution, you may appeal within 7 days by providing
        additional evidence. Each case may be appealed once.
      </p>
    </HelpLayout>
  );
}
