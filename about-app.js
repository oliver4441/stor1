import { Component } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

class ErrorFallback extends Component {
  render() { if (this.state?.hasError) return <div>Error</div>; return this.props.children; }
}

function AboutApp() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 md:p-8">
          <section>
            <h2 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">What is Omix?</h2>
            <p className="leading-relaxed">
              Omix Marketplace v2 is a clean, no-nonsense Kenya-wide online marketplace.
              We believe commerce shouldn't be complicated by forced accounts, heavy applications, or confusing interfaces.
              Omix gives you precisely what you need: a place to list items and a way to find them.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">About this app</h2>
            <p className="leading-relaxed">
              This app was built to showcase the full stack of Omix Marketplace — from product browsing and
              detailed product pages to cart management, checkout, and order tracking. It's a modern
              single-page application built with React, Vite, and Tailwind CSS, powered by a Node.js/Express
              backend and Supabase for storage.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">Why another marketplace?</h2>
            <p className="leading-relaxed">
              Most marketplace apps are either overloaded with features or locked into ecosystems.
              Omix strips it back to what matters: fast, mobile-first browsing, instant chat-based
              ordering, and cash on delivery or M-Pesa payment. No endless signup flows, no app store fees.
            </p>
          </section>
        </div>
      </ErrorBoundary>
    </div>
  );
}

export default AboutApp;
