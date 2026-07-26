import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Database, Lock, Eye, Share2, Cookie, UserCheck, Clock, Trash2, Mail } from 'lucide-react'

function Privacy() {
  const sections = [
    {
      id: 'introduction',
      icon: <Shield className="w-5 h-5" />,
      title: '1. Introduction',
      content: (
        <>
          <p>
            Omix Marketplace ("Omix", "we", "us", or "our") is committed to protecting the privacy and personal data of our users ("you" or "your"). This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use our Platform.
          </p>
          <p>
            This Privacy Policy applies to all users of Omix Marketplace, including buyers, sellers, event organizers, and visitors. By using the Platform, you consent to the collection and use of your information as described in this policy.
          </p>
          <p>
            We process personal data in accordance with the Data Protection Act, 2019 (Kenya) and other applicable data protection laws. We are committed to ensuring that your personal data is processed lawfully, fairly, and transparently.
          </p>
        </>
      ),
    },
    {
      id: 'collection',
      icon: <Database className="w-5 h-5" />,
      title: '2. Information We Collect',
      content: (
        <>
          <p>We collect the following categories of personal information:</p>
          <h4 className="font-bold text-white mt-4 mb-2">2.1 Information You Provide Directly</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, phone number, profile picture, and password when you create an account</li>
            <li><strong>Listing Information:</strong> Item descriptions, prices, images, and location data when you create listings</li>
            <li><strong>Event Information:</strong> Event details, ticket information, and organizer information when you create or manage events</li>
            <li><strong>Communication Data:</strong> Messages sent through the Platform's messaging system</li>
            <li><strong>Payment Information:</strong> Payment details processed through Paystack (we do not store full card details on our servers)</li>
          </ul>
          <h4 className="font-bold text-white mt-4 mb-2">2.2 Information Collected Automatically</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Device Information:</strong> Device type, operating system, browser type, and unique device identifiers</li>
            <li><strong>Usage Data:</strong> Pages visited, features used, search queries, and interaction patterns</li>
            <li><strong>Location Data:</strong> Approximate geographic location based on IP address or device settings (with your permission)</li>
            <li><strong>Log Data:</strong> Access times, error logs, and referral URLs</li>
          </ul>
          <h4 className="font-bold text-white mt-4 mb-2">2.3 Information from Third Parties</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>Payment verification data from Paystack</li>
            <li>Social media information if you choose to link your social media accounts</li>
            <li>Publicly available information relevant to fraud prevention and security</li>
          </ul>
        </>
      ),
    },
    {
      id: 'usage',
      icon: <Eye className="w-5 h-5" />,
      title: '3. How We Use Your Information',
      content: (
        <>
          <p>We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Delivery:</strong> To provide, maintain, and improve the Platform's features and services</li>
            <li><strong>Account Management:</strong> To create and manage your account, authenticate your identity, and provide customer support</li>
            <li><strong>Transaction Processing:</strong> To process payments, manage listings, and facilitate transactions between buyers and sellers</li>
            <li><strong>Communication:</strong> To send you service-related notifications, updates, and respond to your inquiries</li>
            <li><strong>Security:</strong> To detect, prevent, and address fraud, abuse, security risks, and technical issues</li>
            <li><strong>Personalization:</strong> To customize your experience and provide content and features relevant to your interests</li>
            <li><strong>Analytics:</strong> To understand how users interact with the Platform and improve our services</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
          </ul>
        </>
      ),
    },
    {
      id: 'sharing',
      icon: <Share2 className="w-5 h-5" />,
      title: '4. How We Share Your Information',
      content: (
        <>
          <p>We may share your information in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>With Other Users:</strong> Your profile information, listings, and messages may be visible to other users as necessary to facilitate transactions and communication on the Platform</li>
            <li><strong>With Paystack:</strong> Payment-related information is shared with Paystack for the purpose of processing transactions. Paystack's privacy policy governs their handling of your payment data</li>
            <li><strong>With Service Providers:</strong> We may share information with third-party service providers who assist us in operating the Platform, such as hosting providers, analytics services, and customer support tools</li>
            <li><strong>For Legal Reasons:</strong> We may disclose information if required by law, regulation, legal process, or governmental request, or if we believe disclosure is necessary to protect the rights, property, or safety of Omix, our users, or the public</li>
            <li><strong>With Your Consent:</strong> We may share information with third parties when you have given us explicit consent to do so</li>
          </ul>
          <p>
            We do not sell, rent, or trade your personal information to third parties for their marketing purposes without your explicit consent.
          </p>
        </>
      ),
    },
    {
      id: 'security',
      icon: <Lock className="w-5 h-5" />,
      title: '5. Data Security',
      content: (
        <>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of data in transit using SSL/TLS protocols</li>
            <li>Secure storage of passwords using industry-standard hashing algorithms</li>
            <li>Regular security assessments and vulnerability testing</li>
            <li>Access controls limiting employee access to personal data on a need-to-know basis</li>
            <li>Regular backups and disaster recovery procedures</li>
          </ul>
          <p>
            While we strive to protect your personal data, no method of transmission over the Internet or method of electronic storage is 100% secure. We cannot guarantee absolute security, and you acknowledge that you provide your information at your own risk.
          </p>
        </>
      ),
    },
    {
      id: 'cookies',
      icon: <Cookie className="w-5 h-5" />,
      title: '6. Cookies and Tracking Technologies',
      content: (
        <>
          <p>
            Omix uses cookies and similar tracking technologies to enhance your experience on the Platform. Cookies are small data files stored on your device that help us:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Remember your login status and preferences</li>
            <li>Understand how you use the Platform to improve our services</li>
            <li>Deliver relevant content and features</li>
            <li>Maintain security and prevent fraud</li>
          </ul>
          <p>
            You can control cookies through your browser settings. However, disabling cookies may affect the functionality of certain features on the Platform. By continuing to use the Platform, you consent to our use of cookies as described in this policy.
          </p>
        </>
      ),
    },
    {
      id: 'rights',
      icon: <UserCheck className="w-5 h-5" />,
      title: '7. Your Data Protection Rights',
      content: (
        <>
          <p>
            Under the Data Protection Act, 2019 (Kenya), you have the following rights regarding your personal data:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Right of Access:</strong> You have the right to request a copy of the personal data we hold about you</li>
            <li><strong>Right to Rectification:</strong> You have the right to request correction of inaccurate or incomplete personal data</li>
            <li><strong>Right to Erasure:</strong> You have the right to request deletion of your personal data, subject to legal obligations</li>
            <li><strong>Right to Restrict Processing:</strong> You have the right to request that we limit the processing of your personal data in certain circumstances</li>
            <li><strong>Right to Data Portability:</strong> You have the right to request your personal data in a structured, commonly used format</li>
            <li><strong>Right to Object:</strong> You have the right to object to the processing of your personal data for specific purposes</li>
            <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you have the right to withdraw consent at any time</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us using the details provided in Section 11 of this policy. We will respond to your request within 30 days.
          </p>
        </>
      ),
    },
    {
      id: 'retention',
      icon: <Clock className="w-5 h-5" />,
      title: '8. Data Retention',
      content: (
        <>
          <p>
            We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal, accounting, or reporting requirements. The retention period depends on the nature of the data and the purpose of processing:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Data:</strong> Retained for the duration of your account's existence and for a period of 2 years after account deletion</li>
            <li><strong>Transaction Data:</strong> Retained for a minimum of 7 years to comply with tax and financial regulations</li>
            <li><strong>Communication Data:</strong> Retained for 3 years from the date of the communication</li>
            <li><strong>Usage and Analytics Data:</strong> Retained in anonymized form for up to 2 years</li>
          </ul>
          <p>
            After the retention period expires, your personal data will be securely deleted or anonymized so that it can no longer be associated with you.
          </p>
        </>
      ),
    },
    {
      id: 'children',
      icon: <Shield className="w-5 h-5" />,
      title: '9. Children\'s Privacy',
      content: (
        <>
          <p>
            The Platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from children under 18. If we become aware that we have collected personal data from a child under 18, we will take steps to delete such information promptly.
          </p>
          <p>
            If you are a parent or guardian and believe that your child has provided us with personal data, please contact us immediately using the details provided in Section 11.
          </p>
        </>
      ),
    },
    {
      id: 'third-party',
      icon: <Share2 className="w-5 h-5" />,
      title: '10. Third-Party Links and Services',
      content: (
        <>
          <p>
            The Platform may contain links to third-party websites, services, or applications that are not owned or controlled by Omix. This Privacy Policy does not apply to such third-party services. We encourage you to review the privacy policies of any third-party services you access.
          </p>
          <p>
            Our payment processing is handled by Paystack. When you make a payment through the Platform, your payment information is collected and processed by Paystack in accordance with their own privacy policy. We encourage you to review Paystack's privacy policy before making any transactions.
          </p>
        </>
      ),
    },
    {
      id: 'changes',
      icon: <Clock className="w-5 h-5" />,
      title: '11. Changes to This Privacy Policy',
      content: (
        <>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make changes, we will update the "Last Updated" date at the top of this policy.
          </p>
          <p>
            For significant changes, we will provide notice through the Platform or via email. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
          </p>
          <p>
            Your continued use of the Platform after the posting of an updated Privacy Policy constitutes your acceptance of the changes.
          </p>
        </>
      ),
    },
    {
      id: 'contact',
      icon: <Mail className="w-5 h-5" />,
      title: '12. Contact Information',
      content: (
        <>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="fusion-recessed-card p-6 my-4">
            <p className="mb-2"><strong>Omix Marketplace — Data Protection Officer</strong></p>
            <p className="mb-2">Kericho, Kenya</p>
            <p className="mb-2">Email: <a href="mailto:omixsystems@gmail.com" className="text-[var(--seasonal-primary,#71717a)] hover:underline">omixsystems@gmail.com</a></p>
            <p className="mb-2">General Inquiries: <a href="mailto:omixsystems@gmail.com" className="text-[var(--seasonal-primary,#71717a)] hover:underline">omixsystems@gmail.com</a></p>
            <p>Website: <a href="https://omixsystems.store" className="text-[var(--seasonal-primary,#71717a)] hover:underline">www.omixsystems.store</a></p>
          </div>
          <p>
            We will respond to all privacy-related inquiries within 30 days of receipt. If you are not satisfied with our response, you have the right to lodge a complaint with the relevant data protection authority in Kenya.
          </p>
        </>
      ),
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 w-full" data-name="privacy-page">
      {/* Header */}
      <div className="mb-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#4A5771] hover:text-[var(--seasonal-primary,#71717a)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-black text-white tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-[#4A5771] text-lg">
          Last updated: June 7, 2026
        </p>
        <div className="mt-4 p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <strong>Your privacy matters to us.</strong> This Privacy Policy explains how Omix Marketplace collects, uses, and protects your personal information. Please read it carefully.
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="mb-12 p-6 fusion-recessed-card">
        <h2 className="text-lg font-bold text-white mb-4">Table of Contents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-sm text-[#4A5771] hover:text-[var(--seasonal-primary,#71717a)] transition-colors py-1"
            >
              {section.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--seasonal-primary,#71717a)]/10 text-[var(--seasonal-primary,#71717a)] flex items-center justify-center flex-shrink-0">
                {section.icon}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {section.title}
              </h2>
            </div>
            <div className="pl-0 md:pl-13 space-y-4 text-[#8E9BB5] leading-relaxed">
              {section.content}
            </div>
          </section>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-16 pt-8 border-t border-[#353F54] text-center">
        <p className="text-sm text-[#4A5771]">
          &copy; 2026 Omix Marketplace. All rights reserved. Kericho, Kenya.
        </p>
        <p className="text-sm text-[#4A5771] mt-2">
          This Privacy Policy is effective as of June 7, 2026.
        </p>
      </div>
    </div>
  )
}

export default Privacy
