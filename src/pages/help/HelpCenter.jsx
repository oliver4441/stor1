import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Getting Started',
    links: [
      { to: '/help/shopping-guide', label: 'Shopping Guide', desc: 'Learn how to browse, search, and shop on Omix Store' },
      { to: '/help/payment', label: 'How Do I Pay on Omix Store', desc: 'Accepted payment methods and how to complete checkout' },
      { to: '/help/delivery-time', label: 'How Long Does My Order Arrive', desc: 'Estimated delivery times and tracking your order' },
    ],
  },
  {
    title: 'Account & Features',
    links: [
      { to: '/help/wishlist', label: 'Wishlist', desc: 'Save products and buy them later' },
      { to: '/help/affiliate', label: 'Affiliate Program', desc: 'Earn commissions by promoting Omix Store' },
      { to: '/help/track-order', label: 'Track Your Order', desc: 'Real-time order status and delivery tracking' },
    ],
  },
  {
    title: 'Orders & Policies',
    links: [
      { to: '/help/delivery', label: 'Delivery and Shipping', desc: 'Shipping rates, coverage areas, and delivery process' },
      { to: '/help/refund', label: 'How to Apply for a Refund', desc: 'Refund eligibility, process, and timelines' },
      { to: '/help/after-sale', label: 'After Sale Policy', desc: 'Post-purchase support and warranty information' },
      { to: '/help/dispute-resolution', label: 'Dispute Resolution Policy', desc: 'How we handle disputes between buyers and sellers' },
    ],
  },
  {
    title: 'More',
    links: [
      { to: '/help/faq', label: 'FAQ Center', desc: 'Answers to the most common questions' },
      { to: '/help/flash-sale', label: 'Flash Sale', desc: 'Limited-time deals and how they work' },
      { to: '/help/seller-guide', label: 'Seller Guide', desc: 'How to sell on Omix Store' },
    ],
  },
];

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
            Customer Help Center
          </h1>
          <p className="text-[#4A5771] max-w-lg mx-auto">
            Everything you need to know about shopping on Omix Store
          </p>
        </div>

        {/* Search hint */}
        <div className="backdrop-blur-xl fusion-recessed-card p-6 mb-8">
          <p className="text-sm text-[#4A5771] text-center">
            Browse topics below or use the search bar at the top of the page to find answers fast
          </p>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.title} className="mb-10">
            <h2 className="text-lg font-bold text-zinc-200 mb-4 px-1">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group bg-[#28303F]/70 border border-[#353F54] rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <h3 className="font-bold text-white text-sm mb-1 group-hover:text-primary transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-xs text-[#4A5771] leading-relaxed">
                    {link.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Still need help */}
        <div className="backdrop-blur-xl fusion-recessed-card p-6 text-center mt-8">
          <h3 className="font-bold text-white mb-2">Still need help?</h3>
          <p className="text-sm text-[#4A5771] mb-4">
            Contact us via WhatsApp or email and we will get back to you within 24 hours
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/254768213649"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href="mailto:omixsystems@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#28303F] dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-lg hover:bg-[#28303F] dark:hover:bg-zinc-100 transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
