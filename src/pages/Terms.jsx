import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 w-full">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-[var(--seasonal-primary,#ff385c)] transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Terms of Service</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Last updated: June 2025</p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">1. Acceptance of Terms</h2>
          <p className="text-zinc-600 dark:text-zinc-400">By accessing and using Omix ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">2. Listing Fee</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Each listing posted on Omix requires a one-time, non-refundable fee of KES 5, payable via M-Pesa or card through our secure Paystack payment gateway. This fee helps maintain platform quality and reduce spam listings.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">3. User Responsibilities</h2>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2">
            <li>You must provide accurate and truthful information in all listings.</li>
            <li>You are responsible for the items or services you list.</li>
            <li>Prohibited items include illegal goods, counterfeit products, and anything that violates Kenyan law.</li>
            <li>You must not post duplicate or misleading listings.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">4. Content Guidelines</h2>
          <p className="text-zinc-600 dark:text-zinc-400">All listings must comply with our community guidelines. We reserve the right to remove any listing that violates these guidelines or is reported as inappropriate by other users.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">5. Privacy</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Your personal information is handled in accordance with our Privacy Policy. By using the Platform, you consent to the collection and use of your information as described therein.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">6. Limitation of Liability</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Omix acts as a marketplace platform and is not responsible for transactions between users. We do not guarantee the quality, safety, or legality of items listed on the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">7. Changes to Terms</h2>
          <p className="text-zinc-600 dark:text-zinc-400">We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">8. Contact</h2>
          <p className="text-zinc-600 dark:text-zinc-400">For questions about these Terms, please contact us via the Omix WhatsApp support line or through the Contact Us page.</p>
        </section>
      </div>
    </div>
  );
}

export default Terms;
