import { Mail, Phone } from 'lucide-react'

function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full" data-name="about-page">
      <h1 className="text-4xl font-black mb-8 text-zinc-900 dark:text-white tracking-tight">About Omix</h1>
      
      <div className="space-y-12 text-zinc-600 dark:text-zinc-300">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">What is Omix?</h2>
          <p className="leading-relaxed text-lg">
            Omix Marketplace is a modern, clean platform designed specifically for the Kericho community. 
            We believe local commerce shouldn't be complicated by forced accounts, heavy applications, or confusing interfaces. 
            Omix gives you precisely what you need: a beautiful place to list items and a faster way to find them.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">How it works</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#ff385c]/10 text-[#ff385c] flex-shrink-0 flex items-center justify-center text-xs font-bold">1</div>
                <p><strong>Buyers:</strong> Browse or search for items in your area. Contact sellers directly.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#ff385c]/10 text-[#ff385c] flex-shrink-0 flex items-center justify-center text-xs font-bold">2</div>
                <p><strong>Sellers:</strong> Click 'Sell', fill in your details, and your listing is live instantly.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#ff385c]/10 text-[#ff385c] flex-shrink-0 flex items-center justify-center text-xs font-bold">3</div>
                <p><strong>Safety:</strong> We advocate for face-to-face exchanges for goods. Use our M-Pesa integration for safe transactions.</p>
              </li>
            </ul>
          </div>
          
          <div className="bg-zinc-100 dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Contact Us</h2>
            <p className="mb-6 text-sm">Need help or want to report a listing? Reach out to our local team in Kericho.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#ff385c]" />
                <a href="mailto:omixsystems@gmail.com" className="font-bold hover:underline">omixsystems@gmail.com</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#ff385c]" />
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
