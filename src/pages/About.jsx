import { Mail, Phone, ShoppingBag, Shield, Truck } from 'lucide-react'

function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full" data-name="about-page">
      <h1 className="text-4xl font-black mb-8 text-white tracking-tight">About Omix Store</h1>
      
      <div className="space-y-12 text-zinc-300">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">What is Omix?</h2>
          <p className="leading-relaxed text-lg">
            Omix Store is a Kenya-wide online marketplace. We offer a curated selection of quality products — from electronics and fashion to home essentials and school supplies — all at great prices. Browse, add to cart, and pay easily via M-Pesa with delivery to your doorstep.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 text-center">
            <ShoppingBag className="w-8 h-8 text-[var(--seasonal-primary,#1a5632)] mx-auto mb-3" />
            <h3 className="font-bold text-white mb-1">Shop Online</h3>
            <p className="text-sm">Browse products, add to cart, and checkout in seconds.</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 text-center">
            <Shield className="w-8 h-8 text-[var(--seasonal-primary,#1a5632)] mx-auto mb-3" />
            <h3 className="font-bold text-white mb-1">Secure Payments</h3>
            <p className="text-sm">Pay via M-Pesa STK push — safe, instant, no cash needed.</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 text-center">
            <Truck className="w-8 h-8 text-[var(--seasonal-primary,#1a5632)] mx-auto mb-3" />
            <h3 className="font-bold text-white mb-1">Fast Delivery</h3>
            <p className="text-sm">We deliver nationwide within 2-5 business days.</p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">How it works</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--seasonal-primary,#1a5632)]/10 text-[var(--seasonal-primary,#1a5632)] flex-shrink-0 flex items-center justify-center text-xs font-bold">1</div>
                <p><strong>Browse:</strong> Search or filter products by category.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--seasonal-primary,#1a5632)]/10 text-[var(--seasonal-primary,#1a5632)] flex-shrink-0 flex items-center justify-center text-xs font-bold">2</div>
                <p><strong>Checkout:</strong> Add to cart, enter your details, and pay via M-Pesa.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--seasonal-primary,#1a5632)]/10 text-[var(--seasonal-primary,#1a5632)] flex-shrink-0 flex items-center justify-center text-xs font-bold">3</div>
                <p><strong>Delivered:</strong> We deliver to your doorstep nationwide.</p>
              </li>
            </ul>
          </div>
          
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
            <h2 className="text-xl font-bold mb-4 text-white">Contact Us</h2>
            <p className="mb-6 text-sm">Need help with an order? Reach out to our team.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--seasonal-primary,#1a5632)]" />
                <a href="mailto:omixsystems@gmail.com" className="font-bold hover:underline">omixsystems@gmail.com</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[var(--seasonal-primary,#1a5632)]" />
<a href="tel:+254768213649" className="font-bold hover:underline">+254 768 213 649</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
