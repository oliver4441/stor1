import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react';

const SECTIONS = [
  {
    number: '1',
    title: 'Parties',
    content:
      'This Agreement is entered into between Omix Store (a brand of Omix Systems), Kenya ("the Company") represented by Gideon Kipkirui, and the approved affiliate partner ("the Affiliate").',
  },
  {
    number: '2',
    title: 'Purpose',
    content:
      'This Agreement establishes terms for the Affiliate to promote products on the Omix Store platform (market.omixsystems.store) and earn commissions on qualifying sales.',
  },
  {
    number: '3',
    title: 'Affiliate Enrollment and Approval',
    content: null,
    subsections: [
      {
        label: '3.1',
        text: 'Submit a complete application at /affiliate/apply',
      },
      {
        label: '3.2',
        text: 'Applications reviewed and approved/rejected at Company\'s discretion',
      },
      {
        label: '3.3',
        text: 'Approved affiliates get unique referral link: https://market.omixsystems.store/?ref=AFF-XXXXX',
      },
      {
        label: '3.4',
        text: 'Status may be active, inactive, or revoked at Company\'s discretion',
      },
    ],
  },
  {
    number: '4',
    title: 'Commission Structure',
    content: 'Affiliates earn commissions based on their tier level, calculated on total order value excluding shipping, taxes, and discounts. Only completed and delivered orders qualify.',
    subsections: [
      { label: 'Silver', text: '5% commission — 0 to 29 qualifying orders' },
      { label: 'Gold', text: '10% commission — 30 or more qualifying orders' },
    ],
  },
  {
    number: '5',
    title: 'Referral Tracking',
    content:
      'First-touch attribution via "omix_ref" cookie. The cookie has a validity period of 100 years from the date of the first click. Affiliates earn commissions on all qualifying purchases made by their referrals within this period.',
  },
  {
    number: '6',
    title: 'Payout Terms',
    content:
      'Minimum payout threshold is KES 2,000. All payouts are processed via M-Pesa only. Payment processing takes 7-14 business days from the date of the payout request.',
  },
  {
    number: '7',
    title: 'Affiliate Responsibilities',
    content: null,
    subsections: [
      { label: '7.1', text: 'Promote products in a professional and ethical manner' },
      { label: '7.2', text: 'No deceptive or misleading advertising practices' },
      { label: '7.3', text: 'No spam or unsolicited bulk messaging' },
      { label: '7.4', text: 'No self-referrals or purchasing through own affiliate link' },
      { label: '7.5', text: 'No cookie stuffing or other fraudulent tracking methods' },
    ],
  },
  {
    number: '8',
    title: 'Company Responsibilities',
    content: null,
    subsections: [
      { label: '8.1', text: 'Provide affiliate dashboard with real-time metrics' },
      { label: '8.2', text: 'Maintain accurate tracking and attribution systems' },
      { label: '8.3', text: 'Calculate and process commissions in a timely manner' },
    ],
  },
  {
    number: '9',
    title: 'Term and Termination',
    content:
      'This Agreement shall remain in effect until terminated by either party. The Company reserves the right to terminate or suspend this Agreement immediately if the Affiliate violates any terms herein. The Affiliate may terminate this Agreement at any time by providing written notice.',
  },
  {
    number: '10',
    title: 'Limitation of Liability',
    content:
      'The Company shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with this Agreement. The total liability of the Company under this Agreement shall not exceed the total commissions paid or payable to the Affiliate.',
  },
  {
    number: '11',
    title: 'Governing Law',
    content:
      'This Agreement shall be governed by and construed in accordance with the laws of the Republic of Kenya. Any disputes arising under this Agreement shall be subject to the exclusive jurisdiction of the courts of Kenya.',
  },
];

export default function AffiliateAgreement() {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Build a plain-text version of the agreement
    const lines = [];
    lines.push('OMIX STORE AFFILIATE PARTNER AGREEMENT');
    lines.push('Document Version: 1.0 | July 2026');
    lines.push('');
    lines.push('');

    for (const section of SECTIONS) {
      lines.push(`${section.number}. ${section.title}`);
      lines.push('');
      if (section.content) {
        lines.push(section.content);
        lines.push('');
      }
      if (section.subsections) {
        for (const sub of section.subsections) {
          lines.push(`  ${sub.label}: ${sub.text}`);
        }
        lines.push('');
      }
    }

    lines.push('');
    lines.push('--- Signature Section ---');
    lines.push('');
    lines.push('Affiliate Full Name: ______________________________');
    lines.push('Signature: ______________________________');
    lines.push('Date: ______________________________');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Omix_Store_Affiliate_Agreement.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#242C3B] py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Navigation */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            to="/affiliate"
            className="inline-flex items-center gap-1.5 text-sm text-[#4A5771] hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Affiliate Program
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#8E9BB5] border border-zinc-700 hover:bg-[#28303F] transition-colors"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>

        {/* Document Header */}
        <div className="text-center mb-10 pb-8 border-b border-[#353F54]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-500/10 border border-blue-500/20 text-zinc-500 text-xs font-medium mb-4">
            <FileText size={14} />
            Document Version 1.0 | July 2026
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Omix Store Affiliate Partner Agreement
          </h1>
          <p className="text-[#4A5771] text-sm">
            This Agreement governs the relationship between Omix Store and its affiliate partners.
          </p>
        </div>

        {/* Document Body */}
        <div className="space-y-0">
          {SECTIONS.map((section) => (
            <div
              key={section.number}
              id={`section-${section.number}`}
              className="py-8 border-b border-[#353F54]/50 last:border-b-0"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-zinc-500 font-bold text-sm">
                  {section.number.padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white mb-3">
                    {section.title}
                  </h2>
                  {section.content && (
                    <p className="text-[#8E9BB5] leading-relaxed mb-3">
                      {section.content}
                    </p>
                  )}
                  {section.subsections && (
                    <ul className="space-y-2">
                      {section.subsections.map((sub) => (
                        <li key={sub.label} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2.5" />
                          <span className="text-[#8E9BB5] leading-relaxed">
                            <strong className="text-zinc-200">{sub.label}:</strong>{' '}
                            {sub.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Signature Section (reference only) */}
        <div className="mt-12 p-8 rounded-xl bg-[#28303F]/50 border border-[#353F54]">
          <h2 className="text-lg font-bold text-white mb-6">Signature Section</h2>
          <p className="text-[#4A5771] text-sm mb-6">
            This section is for reference purposes. By submitting the affiliate application, you digitally agree to the terms of this Agreement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-[#4A5771] mb-2">Affiliate Full Name</label>
              <div className="h-10 border-b border-zinc-700" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5771] mb-2">Signature</label>
              <div className="h-10 border-b border-zinc-700" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5771] mb-2">Date</label>
              <div className="h-10 border-b border-zinc-700" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            to="/affiliate/apply"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            Apply Now
          </Link>
          <p className="mt-4 text-xs text-[#4A5771]">
            By applying, you agree to the terms outlined in this agreement.
          </p>
        </div>
      </div>
    </div>
  );
}