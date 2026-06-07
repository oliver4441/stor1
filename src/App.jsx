import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ListingDetails from './pages/ListingDetails'
import Sell from './pages/Sell'
import About from './pages/About'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Wishes from './pages/Wishes'
import WishForm from './pages/WishForm'
import WishDetail from './pages/WishDetail'
import HowItWorks from './pages/HowItWorks'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import CreateEvent from './pages/CreateEvent'
import QRScanner from './pages/QRScanner'
import ContactFloat from './components/ContactFloat'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error('App Crash:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
          <div className="max-w-md bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-900/50">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{this.state.error?.message || 'The application failed to load.'}</p>
            <button onClick={() => window.location.href = '/'} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Reload App</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  React.useEffect(() => {
    console.log('Omix App Mounted');
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listing/:id" element={<ListingDetails />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/wishes" element={<Wishes />} />
            <Route path="/wish/new" element={<WishForm />} />
            <Route path="/wishes/:id" element={<WishDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/create" element={<CreateEvent />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/order/:id" element={<EventDetail />} />
            <Route path="/scanner" element={<QRScanner />} />
          </Routes>
        </main>
        <Footer />
        <ContactFloat />
      </div>
    </ErrorBoundary>
  )
}

export default App
