import HelpLayout from './HelpLayout';

export default function Payment() {
  return (
    <HelpLayout title="How Do I Pay on Omix Store">
      <h3>M-Pesa (Recommended)</h3>
      <p>
        M-Pesa is the fastest and most popular payment method on Omix Store. Here is how it works:
      </p>
      <ol>
        <li>Select M-Pesa at checkout</li>
        <li>Enter your M-Pesa phone number</li>
        <li>You will receive an M-Pesa prompt on your phone</li>
        <li>Enter your M-Pesa PIN to confirm the payment</li>
        <li>You will receive a confirmation message once payment is successful</li>
      </ol>

      <h3>M-Pesa Paybill</h3>
      <p>You can also pay directly via M-Pesa Paybill:</p>
      <ul>
        <li>Paybill Number: (displayed at checkout)</li>
        <li>Account Number: Your order number</li>
        <li>Amount: Total order amount</li>
      </ul>
      <p>
        After sending the payment, enter the M-Pesa confirmation code on the checkout page
        to complete your order.
      </p>

      <h3>Bank Transfer</h3>
      <p>
        For larger orders, you can pay via bank transfer. Bank details will be provided at
        checkout. Orders paid via bank transfer will be processed once the payment reflects
        in our account (usually 1-2 business days).
      </p>

      <h3>Cash on Delivery</h3>
      <p>
        Cash on delivery is available for select locations within Kericho town. A small
        convenience fee may apply. Select "Cash on Delivery" at checkout to check if it is
        available in your area.
      </p>

      <h3>Payment Security</h3>
      <p>
        All payments are processed securely. We do not store your M-Pesa PIN or banking
        details. Your payment information is encrypted end-to-end.
      </p>
    </HelpLayout>
  );
}
