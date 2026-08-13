import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { isAdmin } from '../utils/api';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Settings,
  LogOut, ShieldCheck, Menu, X, ChevronRight, Tag, Bell, Link as LinkIcon,
  MessageSquare, Gift, Store, Send, UserCog, FileBarChart, ShieldAlert,
  Boxes, ExternalLink, CheckCircle, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { sounds } from '../utils/sounds';
import { GooeyLoader } from '@/components/ui/loader-10';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { path: '/admin', label: 'Overview', icon: LayoutDashboard, hint: 'Today at a glance' },
      { path: '/admin/products', label: 'Products', icon: Package, hint: 'Catalog & inventory' },
      { path: '/admin/orders', label: 'Orders', icon: ShoppingBag, hint: 'Fulfilment queue' },
    ],
  },
  {
    label: 'People & growth',
    items: [
      { path: '/admin/customers', label: 'Customers', icon: Users, hint: 'Customer directory' },
      { path: '/admin/users', label: 'User accounts', icon: UserCog, hint: 'Roles & access' },
      { path: '/admin/sellers', label: 'Sellers', icon: Store, hint: 'Seller approvals' },
      { path: '/admin/affiliates', label: 'Affiliates', icon: LinkIcon, hint: 'Partner programme' },
    ],
  },
  {
    label: 'Merchandising',
    items: [
      { path: '/admin/deals', label: 'Flash deals', icon: Gift, hint: 'Timed promotions' },
      { path: '/admin/promo-codes', label: 'Promo codes', icon: Tag, hint: 'Discount rules' },
      { path: '/admin/bundles', label: 'Bundles', icon: Boxes, hint: 'Product collections' },
      { path: '/admin/dropship', label: 'Dropship', icon: Package, hint: 'Supplier catalogue' },
    ],
  },
  {
    label: 'Insights & trust',
    items: [
      { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, hint: 'Performance trends' },
      { path: '/admin/reports', label: 'Reports', icon: FileBarChart, hint: 'Operational reports' },
      { path: '/admin/fraud', label: 'Fraud review', icon: ShieldAlert, hint: 'Risk signals' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { path: '/admin/broadcast', label: 'Broadcast', icon: Send, hint: 'Reach customers' },
      { path: '/admin/notifications', label: 'Notifications', icon: Bell, hint: 'Push centre' },
      { path: '/admin/inbox', label: 'Inbox', icon: MessageSquare, hint: 'Seller messages' },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(group => group.items);

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) { setAccessDenied(true); navigate('/login'); return; }
        const admin = await isAdmin();
        if (!admin) { setAccessDenied(true); navigate('/account'); return; }
        setUser(currentUser);
      } catch (err) {
        console.error('Admin auth check failed:', err);
        setAccessDenied(true);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    sounds.logout();
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isOverviewPath = location.pathname === '/admin' || location.pathname === '/admin/dashboard';
  const currentPage = ALL_NAV_ITEMS.find(item => item.path === location.pathname || (item.path === '/admin' && isOverviewPath)) || ALL_NAV_ITEMS[0];
  const userInitial = user?.email?.charAt(0).toUpperCase() || 'A';
  const currentGroup = NAV_GROUPS.find(group => group.items.some(item => item.path === currentPage.path));

  if (loading || accessDenied) {
    return (
      <div className="admin-loading-screen">
        <GooeyLoader label="Securing your admin workspace" />
      </div>
    );
  }

  return (
    <div className={`admin-shell ${sidebarCollapsed ? 'admin-sidebar-collapsed' : ''}`}>
      <div className={`admin-sidebar-backdrop ${sidebarOpen ? 'is-open' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Admin navigation">
        <div className="admin-sidebar-inner">
          <div className="admin-brand-row">
            <Link to="/admin" className="admin-brand" aria-label="Omix admin overview">
              <span className="admin-brand-mark"><ShieldCheck className="h-[18px] w-[18px]" /></span>
              <span className="admin-brand-copy"><strong>omix<span>store</span></strong><small>Operations</small></span>
            </Link>
            <button type="button" className="admin-mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close admin navigation"><X className="h-5 w-5" /></button>
          </div>

          <div className="admin-workspace-switcher">
            <span className="admin-workspace-avatar">O</span>
            <span><strong>Omix Store</strong><small>Marketplace admin</small></span>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </div>

          <nav className="admin-nav-scroll">
            {NAV_GROUPS.map(group => (
              <div className="admin-nav-group" key={group.label}>
                <p className="admin-nav-label">{group.label}</p>
                <div className="admin-nav-items">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = item.path === '/admin' ? isOverviewPath : location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} className={`admin-nav-link ${active ? 'is-active' : ''}`} title={sidebarCollapsed ? item.label : undefined}>
                        <span className="admin-nav-icon"><Icon className="h-[17px] w-[17px]" /></span>
                        <span className="admin-nav-link-copy"><strong>{item.label}</strong><small>{item.hint}</small></span>
                        {active && <span className="admin-nav-active-dot" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="admin-nav-group admin-nav-group-last">
              <p className="admin-nav-label">System</p>
              <Link to="/admin/settings" className={`admin-nav-link ${location.pathname === '/admin/settings' ? 'is-active' : ''}`} title={sidebarCollapsed ? 'Settings' : undefined}>
                <span className="admin-nav-icon"><Settings className="h-[17px] w-[17px]" /></span>
                <span className="admin-nav-link-copy"><strong>Settings</strong><small>Store preferences</small></span>
                {location.pathname === '/admin/settings' && <span className="admin-nav-active-dot" />}
              </Link>
            </div>
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-user-card">
              <span className="admin-user-avatar">{userInitial}</span>
              <span className="admin-user-copy"><strong>{user?.email || 'Administrator'}</strong><small>Administrator</small></span>
              <span className="admin-online-dot" />
            </div>
            <button type="button" onClick={handleLogout} className="admin-logout-button"><LogOut className="h-4 w-4" /><span>Sign out</span></button>
          </div>
        </div>
      </aside>

      <div className="admin-main-shell">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button type="button" className="admin-mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open admin navigation"><Menu className="h-5 w-5" /></button>
            <button type="button" className="admin-collapse-button" onClick={() => setSidebarCollapsed(value => !value)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <div className="admin-breadcrumbs"><span>{currentGroup?.label || 'Workspace'}</span><ChevronRight className="h-3.5 w-3.5" /><strong>{currentPage.label}</strong></div>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-store-status"><i /> Store online</span>
            <Link to="/" className="admin-view-store"><ExternalLink className="h-3.5 w-3.5" /> <span>View store</span></Link>
          </div>
        </header>

        <main className="admin-main-content">
          <div className="admin-content-inner">
            {(isOverviewPath || location.pathname === '/admin/inbox') && (
              <div className="admin-page-heading-bar">
                <div><span className="admin-page-kicker">{currentGroup?.label || 'Workspace'}</span><h1>{currentPage.label}</h1><p>{currentPage.hint}</p></div>
                <div className="admin-page-heading-meta"><CheckCircle className="h-4 w-4" /> All systems operational</div>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
