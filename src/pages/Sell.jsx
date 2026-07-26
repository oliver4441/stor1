import { useState } from 'react';
import { Package, ArrowRight, CheckCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const C = {
  bg: '#111318',
  border: '#1E2128',
  text: '#F0F2F5',
  textMuted: '#6B7280',
  accent: '#007AFF',
  bgGray: '#1A1D24',
};

export default function Sell() {
  const [activeTab, setActiveTab] = useState('how');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-name="sell-page">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${C.accent}15` }}>
          <Package className="w-8 h-8" style={{ color: C.accent }} />
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ color: C.text }}>Sell on Omix Store</h1>
        <p className="text-sm" style={{ color: C.textMuted }}>Reach thousands of buyers in Kericho and beyond</p>
      </div>

      <div className="flex gap-2 mb-8 justify-center">
        <button
          onClick={() => setActiveTab('how')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'how' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          style={activeTab === 'how' ? { backgroundColor: C.accent } : {}}
        >How It Works</button>
        <button
          onClick={() => setActiveTab('benefits')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'benefits' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          style={activeTab === 'benefits' ? { backgroundColor: C.accent } : {}}
        >Benefits</button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'faq' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          style={activeTab === 'faq' ? { backgroundColor: C.accent } : {}}
        >FAQ</button>
      </div>

      {activeTab === 'how' && (
        <div className="space-y-4">
          {[
            { step: '1', title: 'Create an Account', desc: 'Sign up as a seller and verify your identity.' },
            { step: '2', title: 'List Your Products', desc: 'Add photos, set prices, and describe your items.' },
            { step: '3', title: 'Get Notified of Orders', desc: 'Receive real-time notifications when a buyer places an order.' },
            { step: '4', title: 'Deliver & Get Paid', desc: 'Deliver the product and receive payment via M-Pesa.' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4 p-4 rounded-2xl border" style={{ borderColor: C.border, backgroundColor: C.bg }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold" style={{ backgroundColor: C.accent }}>{item.step}</div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: C.text }}>{item.title}</h3>
                <p className="text-xs mt-1" style={{ color: C.textMuted }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'benefits' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Zero Listing Fees', desc: 'List your products for free. Pay only when you sell.' },
            { title: 'Local Reach', desc: 'Connect with buyers right here in Kericho and surrounding areas.' },
            { title: 'M-Pesa Payments', desc: 'Get paid directly to your M-Pesa account.' },
            { title: 'Seller Dashboard', desc: 'Track your sales, earnings, and manage listings in one place.' },
          ].map((item) => (
            <div key={item.title} className="p-5 rounded-2xl border" style={{ borderColor: C.border, backgroundColor: C.bg }}>
              <CheckCircle className="w-5 h-5 mb-3" style={{ color: C.accent }} />
              <h3 className="font-bold text-sm mb-1" style={{ color: C.text }}>{item.title}</h3>
              <p className="text-xs" style={{ color: C.textMuted }}>{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="space-y-3">
          {[
            { q: 'How much does it cost to sell?', a: 'Listing is completely free. We charge a small commission only when you make a sale.' },
            { q: 'How do I get paid?', a: 'Payments are sent directly to your M-Pesa account after the buyer confirms delivery.' },
            { q: 'Can I sell used items?', a: 'Yes, you can list both new and used items. Just make sure to accurately describe the condition.' },
            { q: 'How do I deliver products?', a: 'You arrange delivery with the buyer. We provide guidelines to ensure smooth transactions.' },
          ].map((item, i) => (
            <details key={i} className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
              <summary className="px-4 py-3 font-bold text-sm cursor-pointer" style={{ color: C.text, backgroundColor: C.bg }}>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" style={{ color: C.accent }} />
                  {item.q}
                </div>
              </summary>
              <div className="px-4 pb-3 text-xs" style={{ color: C.textMuted, backgroundColor: C.bg }}>{item.a}</div>
            </details>
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <Link
          to="/seller/register"
          className="inline-flex items-center gap-2 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: C.accent }}
        >
          Start Selling <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
