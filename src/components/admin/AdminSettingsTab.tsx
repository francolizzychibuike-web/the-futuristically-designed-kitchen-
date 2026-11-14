import React, { useEffect, useState } from 'react';
import type { AdminUser, RestaurantSettings } from '../../types/restaurant.ts';

interface PaymentSettingsData {
  provider: string;
  enabled: boolean;
  mode: 'test' | 'live';
  public_key: string;
  has_secret_key: boolean;
  secret_key_hint: string;
}

interface AdminSettingsTabProps {
  settings: RestaurantSettings | null;
  paymentSettings: PaymentSettingsData | null;
  adminUsers: AdminUser[];
  currentAdminRole: 'super_admin' | 'manager';
  onSaveSettings: (payload: Partial<RestaurantSettings>) => Promise<void>;
  onSavePaymentSettings: (payload: {
    enabled: boolean;
    mode: 'test' | 'live';
    public_key: string;
    secret_key?: string;
  }) => Promise<void>;
  onCreateAdminUser: (payload: { name: string; email: string; password: string; role: 'super_admin' | 'manager' }) => Promise<void>;
}

export function AdminSettingsTab({
  settings,
  paymentSettings,
  adminUsers,
  currentAdminRole,
  onSaveSettings,
  onSavePaymentSettings,
  onCreateAdminUser,
}: AdminSettingsTabProps) {
  const [businessName, setBusinessName] = useState(settings?.business_name || '');
  const [tagline, setTagline] = useState(settings?.tagline || '');
  const [heroTitle, setHeroTitle] = useState(settings?.hero_title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(settings?.hero_subtitle || '');
  const [phone, setPhone] = useState(settings?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsapp_number || '');
  const [email, setEmail] = useState(settings?.email || '');
  const [address, setAddress] = useState(settings?.address || '');
  const [city, setCity] = useState(settings?.city || '');
  const [deliveryFee, setDeliveryFee] = useState(String(settings?.delivery_fee_ngn ?? 2500));
  const [freeThreshold, setFreeThreshold] = useState(String(settings?.free_delivery_threshold_ngn ?? 30000));
  const [savingRestaurant, setSavingRestaurant] = useState(false);

  const [paystackEnabled, setPaystackEnabled] = useState(Boolean(paymentSettings?.enabled));
  const [paystackMode, setPaystackMode] = useState<'test' | 'live'>(paymentSettings?.mode || 'test');
  const [paystackPublicKey, setPaystackPublicKey] = useState(paymentSettings?.public_key || '');
  const [paystackSecretKey, setPaystackSecretKey] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'manager' | 'super_admin'>('manager');

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name);
      setTagline(settings.tagline);
      setHeroTitle(settings.hero_title);
      setHeroSubtitle(settings.hero_subtitle);
      setPhone(settings.phone);
      setWhatsappNumber(settings.whatsapp_number);
      setEmail(settings.email);
      setAddress(settings.address);
      setCity(settings.city);
      setDeliveryFee(String(settings.delivery_fee_ngn));
      setFreeThreshold(String(settings.free_delivery_threshold_ngn));
    }
  }, [settings]);

  useEffect(() => {
    if (paymentSettings) {
      setPaystackEnabled(paymentSettings.enabled);
      setPaystackMode(paymentSettings.mode);
      setPaystackPublicKey(paymentSettings.public_key);
    }
  }, [paymentSettings]);

  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRestaurant(true);
    try {
      await onSaveSettings({
        business_name: businessName,
        tagline,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        phone,
        whatsapp_number: whatsappNumber,
        email,
        address,
        city,
        delivery_fee_ngn: Number(deliveryFee),
        free_delivery_threshold_ngn: Number(freeThreshold),
      });
    } finally {
      setSavingRestaurant(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      await onSavePaymentSettings({
        enabled: paystackEnabled,
        mode: paystackMode,
        public_key: paystackPublicKey,
        ...(paystackSecretKey.trim() ? { secret_key: paystackSecretKey.trim() } : {}),
      });
      setPaystackSecretKey('');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateAdminUser({
      name: newAdminName,
      email: newAdminEmail,
      password: newAdminPassword,
      role: newAdminRole,
    });
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPassword('');
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Restaurant Information */}
        <form
          onSubmit={handleSaveRestaurant}
          className="lg:col-span-7 bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-4"
        >
          <h2 className="font-display text-xl font-bold text-[#133827]">Restaurant Information & Delivery Pricing</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="set-name" className="block text-xs font-semibold">Business Name</label>
              <input
                id="set-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="set-email" className="block text-xs font-semibold">Email</label>
              <input
                id="set-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="set-tagline" className="block text-xs font-semibold">Tagline</label>
            <input
              id="set-tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="set-hero-title" className="block text-xs font-semibold">Hero Headline</label>
            <input
              id="set-hero-title"
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="set-hero-sub" className="block text-xs font-semibold">Hero Subtitle</label>
            <textarea
              id="set-hero-sub"
              rows={2}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="set-phone" className="block text-xs font-semibold">Phone</label>
              <input
                id="set-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="set-wa" className="block text-xs font-semibold">WhatsApp Number (Digits)</label>
              <input
                id="set-wa"
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="set-address" className="block text-xs font-semibold">Street Address</label>
              <input
                id="set-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="set-city" className="block text-xs font-semibold">City / State</label>
              <input
                id="set-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="set-deliv" className="block text-xs font-semibold">Delivery Fee (₦)</label>
              <input
                id="set-deliv"
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="set-thresh" className="block text-xs font-semibold">Free Delivery Threshold (₦)</label>
              <input
                id="set-thresh"
                type="number"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingRestaurant}
            className="px-5 py-2.5 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20] cursor-pointer"
          >
            {savingRestaurant ? 'Saving Settings...' : 'Save Restaurant Settings'}
          </button>
        </form>

        {/* Paystack Payment Settings */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSavePayment}
            className="bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-4"
          >
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#133827]">Paystack Payment Settings</h2>
              <p className="text-xs text-[#5A665F]">
                Secret keys are stored strictly on the backend and never exposed to customers. Transactions are verified against Paystack APIs before marking orders paid.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={paystackEnabled}
                onChange={(e) => setPaystackEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#15422D]"
              />
              <span>Enable Paystack Online Checkout</span>
            </label>

            <div className="space-y-1">
              <label htmlFor="paystack-mode" className="block text-xs font-semibold">Environment Mode</label>
              <select
                id="paystack-mode"
                value={paystackMode}
                onChange={(e) => setPaystackMode(e.target.value as 'test' | 'live')}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
              >
                <option value="test">Test Mode (pk_test / sk_test)</option>
                <option value="live">Live Production Mode (pk_live / sk_live)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="paystack-pk" className="block text-xs font-semibold">Paystack Public Key</label>
              <input
                id="paystack-pk"
                type="text"
                value={paystackPublicKey}
                onChange={(e) => setPaystackPublicKey(e.target.value)}
                placeholder="pk_test_..."
                className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="paystack-sk" className="block text-xs font-semibold">
                Paystack Secret Key{' '}
                {paymentSettings?.has_secret_key && (
                  <span className="font-mono text-[#15422D]">(Stored: {paymentSettings.secret_key_hint})</span>
                )}
              </label>
              <input
                id="paystack-sk"
                type="password"
                value={paystackSecretKey}
                onChange={(e) => setPaystackSecretKey(e.target.value)}
                placeholder={paymentSettings?.has_secret_key ? 'Leave blank to keep existing key' : 'sk_test_...'}
                className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={savingPayment}
              className="px-5 py-2.5 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20] cursor-pointer"
            >
              {savingPayment ? 'Saving...' : 'Save Payment Configuration'}
            </button>
          </form>

          {/* Admin Users */}
          <div className="bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-[#133827]">Authorized Administrators</h3>
            <ul className="divide-y divide-[#F0ECE3] text-xs">
              {adminUsers.map((u) => (
                <li key={u.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#17201B]">{u.name}</p>
                    <p className="text-[#5A665F]">{u.email}</p>
                  </div>
                  <span className="font-mono text-[#15422D]">{u.role}</span>
                </li>
              ))}
            </ul>

            {currentAdminRole === 'super_admin' && (
              <form onSubmit={handleAddAdmin} className="pt-3 border-t border-[#F0ECE3] space-y-3">
                <p className="text-xs font-semibold text-[#133827]">Add Administrator</p>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Staff Name"
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
                />
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Staff Email"
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
                />
                <div className="flex gap-2">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Password (8+ chars)"
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
                  />
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as 'manager' | 'super_admin')}
                    className="px-2.5 py-2 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
                  >
                    <option value="manager">Manager</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#133827] text-white rounded-lg hover:bg-[#0E2F20] cursor-pointer"
                >
                  Create Admin Account
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
