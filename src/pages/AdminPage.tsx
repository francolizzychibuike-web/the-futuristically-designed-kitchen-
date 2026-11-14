import React, { useCallback, useEffect, useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import type {
  AdminUser,
  ContactMessage,
  GalleryItem,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  RestaurantSettings,
  Review,
  ReviewStatus,
} from '../types/restaurant.ts';
import { AdminOverviewTab, type DashboardData } from '../components/admin/AdminOverviewTab.tsx';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab.tsx';
import { AdminMenuTab } from '../components/admin/AdminMenuTab.tsx';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab.tsx';
import {
  AdminGallerySection,
  AdminMessagesSection,
  AdminReviewsSection,
} from '../components/admin/AdminCommunityTab.tsx';

export function AdminPage() {
  const { categories, refreshMenu, refreshSettings, notify } = useRestaurant();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'manager';
  } | null>(null);

  // Login / Initial Setup fields (no hardcoded credentials!)
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Dashboard tabs & data
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [adminSettings, setAdminSettings] = useState<RestaurantSettings | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<{
    provider: string;
    enabled: boolean;
    mode: 'test' | 'live';
    public_key: string;
    has_secret_key: boolean;
    secret_key_hint: string;
  } | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const loadAllAdminData = useCallback(async () => {
    try {
      const [dashRes, ordRes, prodRes, revRes, galRes, msgRes, setRes, payRes, usrRes] =
        await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/orders'),
          fetch('/api/admin/products'),
          fetch('/api/admin/reviews'),
          fetch('/api/admin/gallery'),
          fetch('/api/admin/messages'),
          fetch('/api/admin/settings'),
          fetch('/api/admin/payment-settings'),
          fetch('/api/admin/users'),
        ]);

      if (dashRes.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (prodRes.ok) setAdminProducts(await prodRes.json());
      if (revRes.ok) setReviews(await revRes.json());
      if (galRes.ok) setGallery(await galRes.json());
      if (msgRes.ok) setMessages(await msgRes.json());
      if (setRes.ok) setAdminSettings(await setRes.json());
      if (payRes.ok) setPaymentSettings(await payRes.json());
      if (usrRes.ok) setAdminUsers(await usrRes.json());
    } catch {
      notify('Error loading dashboard data.', 'error');
    }
  }, [notify]);

  useEffect(() => {
    setCheckingAuth(true);
    fetch('/api/admin/auth/status')
      .then((res) => res.json())
      .then(async (data) => {
        setHasAdmin(Boolean(data.hasAdmin));
        setCurrentAdmin(data.admin || null);
        if (data.authenticated) {
          await loadAllAdminData();
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      })
      .finally(() => setCheckingAuth(false));
  }, [loadAllAdminData]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    const endpoint = hasAdmin ? '/api/admin/auth/login' : '/api/admin/auth/setup';
    const payload = hasAdmin
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }
      setHasAdmin(true);
      setCurrentAdmin(data.admin);
      setAuthPassword('');
      await loadAllAdminData();
      setAuthenticated(true);
      notify(`Welcome, ${data.admin.name}`, 'success');
    } catch {
      setAuthError('Network error during authentication.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setCurrentAdmin(null);
    notify('Signed out of Administrator Dashboard.', 'info');
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(paymentStatus ? { paymentStatus } : {}) }),
    });
    if (!res.ok) {
      const err = await res.json();
      notify(err.error || 'Failed to update order.', 'error');
      return;
    }
    notify('Order updated.', 'success');
    await loadAllAdminData();
  };

  const handleUploadImage = async (dataUrl: string): Promise<string> => {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Image upload failed.', 'error');
      throw new Error(data.error || 'Upload failed');
    }
    notify('Image uploaded!', 'success');
    return data.url;
  };

  const handleSaveProduct = async (payload: Partial<Product>, editId?: number) => {
    const url = editId ? `/api/admin/products/${editId}` : '/api/admin/products';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Failed to save dish.', 'error');
      return;
    }
    notify(editId ? 'Dish updated.' : 'Dish added to menu.', 'success');
    await Promise.all([loadAllAdminData(), refreshMenu()]);
  };

  const handleDeleteProduct = async (id: number) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      notify('Could not delete dish.', 'error');
      return;
    }
    notify('Dish removed from menu.', 'info');
    await Promise.all([loadAllAdminData(), refreshMenu()]);
  };

  const handleModerateReview = async (id: number, status: ReviewStatus) => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      notify(`Review marked ${status}.`, 'success');
      await loadAllAdminData();
    }
  };

  const handleDeleteReview = async (id: number) => {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify('Review deleted.', 'info');
      await loadAllAdminData();
    }
  };

  const handleAddGalleryItem = async (payload: {
    title: string;
    category: string;
    image_url: string;
    caption: string;
  }) => {
    const res = await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      notify('Photo added to gallery.', 'success');
      await loadAllAdminData();
    }
  };

  const handleDeleteGalleryItem = async (id: number) => {
    const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify('Gallery photograph removed.', 'info');
      await loadAllAdminData();
    }
  };

  const handleUpdateMessageStatus = async (id: number, status: 'unread' | 'read' | 'replied') => {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      notify('Message status updated.', 'success');
      await loadAllAdminData();
    }
  };

  const handleSaveSettings = async (payload: Partial<RestaurantSettings>) => {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      notify('Restaurant information saved.', 'success');
      await Promise.all([loadAllAdminData(), refreshSettings()]);
    }
  };

  const handleSavePaymentSettings = async (payload: {
    enabled: boolean;
    mode: 'test' | 'live';
    public_key: string;
    secret_key?: string;
  }) => {
    const res = await fetch('/api/admin/payment-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Could not update payment settings.', 'error');
      return;
    }
    notify('Paystack configuration saved.', 'success');
    await Promise.all([loadAllAdminData(), refreshSettings()]);
  };

  const handleCreateAdminUser = async (payload: {
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'manager';
  }) => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Failed to create administrator.', 'error');
      return;
    }
    notify(`Administrator ${data.name} added.`, 'success');
    await loadAllAdminData();
  };

  if (checkingAuth) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-sm text-[#5A665F]">
        Verifying administrator session...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <form
          onSubmit={handleAuthSubmit}
          className="bg-white rounded-2xl border border-[#E8E1D3] p-7 sm:p-8 space-y-5 shadow-sm"
        >
          <div className="space-y-1.5">
            <div className="w-11 h-11 rounded-xl bg-[#E8F3EC] text-[#15422D] flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#133827]">
              {hasAdmin ? 'Administrator Sign In' : 'Create Initial Administrator'}
            </h1>
            <p className="text-xs text-[#5A665F] leading-relaxed">
              {hasAdmin
                ? 'Sign in with your authorized administrator email and password to manage orders, menu items, reviews, and Paystack settings.'
                : 'No administrator account exists yet. Create the primary super administrator account to secure your restaurant dashboard.'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
              {authError}
            </div>
          )}

          {!hasAdmin && (
            <div className="space-y-1.5">
              <label htmlFor="admin-name" className="block text-xs font-semibold text-[#17201B]">
                Full Name *
              </label>
              <input
                id="admin-name"
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="e.g. Amina Yusuf"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="block text-xs font-semibold text-[#17201B]">
              Administrator Email *
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="admin@restaurant.com"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-xs font-semibold text-[#17201B]">
              Password *
            </label>
            <input
              id="admin-password"
              type="password"
              required
              minLength={8}
              autoComplete={hasAdmin ? 'current-password' : 'new-password'}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
            />
          </div>

          <button
            type="submit"
            disabled={authSubmitting}
            className="w-full py-3 px-5 text-sm font-semibold bg-[#15422D] hover:bg-[#0E2F20] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {authSubmitting
              ? 'Authenticating...'
              : hasAdmin
              ? 'Sign In to Dashboard'
              : 'Create Administrator & Continue'}
          </button>
        </form>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: `Orders (${orders.length})` },
    { id: 'menu', label: `Food Menu (${adminProducts.length})` },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
    { id: 'gallery', label: `Gallery (${gallery.length})` },
    { id: 'messages', label: `Messages (${messages.length})` },
    { id: 'settings', label: 'Settings & Paystack' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E1D3]">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#9F742B]">
            Administrator Workspace · {currentAdmin?.name} ({currentAdmin?.role})
          </p>
          <h1 className="font-display text-3xl font-bold text-[#133827]">
            The Future Kitchen Console
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-[#DCD4C4] text-[#133827] bg-white hover:bg-[#F3EFE6] rounded-lg cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div role="tablist" aria-label="Admin sections" className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#15422D] text-white'
                : 'bg-white border border-[#E8E1D3] text-[#3D4A42] hover:bg-[#EFECE4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {activeTab === 'overview' && (
        <AdminOverviewTab data={dashboardData} onNavigateTab={setActiveTab} />
      )}
      {activeTab === 'orders' && (
        <AdminOrdersTab orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
      )}
      {activeTab === 'menu' && (
        <AdminMenuTab
          categories={categories}
          products={adminProducts}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onUploadImage={handleUploadImage}
        />
      )}
      {activeTab === 'reviews' && (
        <AdminReviewsSection
          reviews={reviews}
          onModerateReview={handleModerateReview}
          onDeleteReview={handleDeleteReview}
        />
      )}
      {activeTab === 'gallery' && (
        <AdminGallerySection
          items={gallery}
          onAddGalleryItem={handleAddGalleryItem}
          onDeleteGalleryItem={handleDeleteGalleryItem}
          onUploadImage={handleUploadImage}
        />
      )}
      {activeTab === 'messages' && (
        <AdminMessagesSection
          messages={messages}
          onUpdateMessageStatus={handleUpdateMessageStatus}
        />
      )}
      {activeTab === 'settings' && (
        <AdminSettingsTab
          settings={adminSettings}
          paymentSettings={paymentSettings}
          adminUsers={adminUsers}
          currentAdminRole={currentAdmin?.role || 'manager'}
          onSaveSettings={handleSaveSettings}
          onSavePaymentSettings={handleSavePaymentSettings}
          onCreateAdminUser={handleCreateAdminUser}
        />
      )}
    </div>
  );
}
