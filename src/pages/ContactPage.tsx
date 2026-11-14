import React, { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { validateContactInput } from '../utils/restaurantLogic.ts';

export function ContactPage() {
  const { settings, notify } = useRestaurant();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Table Reservation / Inquiry');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const whatsappDigits = (settings?.whatsapp_number || '2348005550199').replace(/[^0-9]/g, '');
  const whatsappLink = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    'Hello The Future Kitchen, I would like to make an inquiry.'
  )}`;
  const mapQuery = encodeURIComponent(settings?.map_embed_query || 'Victoria Island, Lagos, Nigeria');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSentMessage('');

    const validation = validateContactInput({ name, email, phone, subject, message });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        notify(data.error || 'Could not send message.', 'error');
        return;
      }

      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setSentMessage(data.message || 'Your message has been sent. We will get back to you shortly.');
      notify('Message sent to The Future Kitchen!', 'success');
    } catch {
      notify('Network error sending message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold tracking-wider text-[#9F742B]">
          Contact & Reservations · Editable Sample Contact Info
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#133827]">
          Get in Touch With Us
        </h1>
        <p className="text-base text-[#4D5A52]">
          Questions about catering, group dining, special dietary requests, or an active order? Reach our hospitality desk directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Info & WhatsApp */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-[#E8E1D3] p-6 sm:p-7 space-y-5">
            <h2 className="font-display text-2xl font-bold text-[#133827]">Restaurant Details</h2>

            <div className="space-y-4 text-sm text-[#3D4A42]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#15422D] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#17201B]">Address</p>
                  <p>{settings?.address || '14 Adeola Odeku Way, Victoria Island (Sample Address)'}</p>
                  <p className="text-xs text-[#5A665F]">{settings?.city || 'Lagos, Nigeria'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#15422D] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#17201B]">Phone</p>
                  <a
                    href={`tel:${settings?.phone || '+2348005550199'}`}
                    className="font-mono tabular-nums hover:underline"
                  >
                    {settings?.phone || '+234 800 555 0199'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#15422D] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#17201B]">Email</p>
                  <a
                    href={`mailto:${settings?.email || 'hello@thefuturekitchen.ng'}`}
                    className="hover:underline"
                  >
                    {settings?.email || 'hello@thefuturekitchen.ng'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#15422D] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="w-full space-y-1">
                  <p className="font-semibold text-[#17201B]">Opening Hours</p>
                  {(settings?.opening_hours || [
                    { days: 'Monday – Thursday', hours: '10:00 AM – 10:00 PM' },
                    { days: 'Friday – Saturday', hours: '10:00 AM – 11:30 PM' },
                    { days: 'Sunday', hours: '12:00 PM – 10:00 PM' },
                  ]).map((row) => (
                    <div key={row.days} className="flex justify-between gap-3 text-xs">
                      <span>{row.days}</span>
                      <span className="font-mono tabular-nums">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0ECE3] space-y-3">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold bg-[#15422D] hover:bg-[#0E2F20] text-white rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Chat on WhatsApp</span>
              </a>

              <div className="flex items-center justify-between pt-2 text-xs text-[#5A665F]">
                <span>Follow us:</span>
                <div className="flex items-center gap-4 font-medium text-[#15422D]">
                  <a href={settings?.instagram_url || 'https://instagram.com'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Instagram
                  </a>
                  <a href={settings?.facebook_url || 'https://facebook.com'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Facebook
                  </a>
                  <a href={settings?.twitter_url || 'https://x.com'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    X / Twitter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-7 bg-white rounded-xl border border-[#E8E1D3] p-6 sm:p-8 space-y-5"
        >
          <h2 className="font-display text-2xl font-bold text-[#133827]">Send Us a Message</h2>

          {sentMessage && (
            <div className="p-4 rounded-lg bg-[#E8F3EC] border border-[#C6DFCF] text-sm text-[#133827] flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#15422D]" aria-hidden="true" />
              <span>{sentMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="block text-sm font-medium text-[#17201B]">
                Your Name *
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
              />
              {errors.name && <p className="text-xs text-[#991B1B]">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="block text-sm font-medium text-[#17201B]">
                Email Address *
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
              />
              {errors.email && <p className="text-xs text-[#991B1B]">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="contact-phone" className="block text-sm font-medium text-[#17201B]">
                Phone Number (optional)
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono focus:outline-none focus:border-[#15422D]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-subject" className="block text-sm font-medium text-[#17201B]">
                Topic
              </label>
              <select
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
              >
                <option value="Table Reservation / Inquiry">Table Reservation / Inquiry</option>
                <option value="Catering & Event Trays">Catering & Event Trays</option>
                <option value="Order Assistance">Order Assistance</option>
                <option value="General Feedback">General Feedback</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-message" className="block text-sm font-medium text-[#17201B]">
              Message *
            </label>
            <textarea
              id="contact-message"
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can our kitchen or hospitality team help you?"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
            />
            {errors.message && <p className="text-xs text-[#991B1B]">{errors.message}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 text-sm font-semibold bg-[#15422D] hover:bg-[#0E2F20] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Sending Message...' : 'Send Message'}
          </button>
        </form>
      </div>

      {/* Location Map Section */}
      <section className="bg-white rounded-xl border border-[#E8E1D3] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E1D3] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#133827]">Location Map</h2>
            <p className="text-xs text-[#5A665F]">{settings?.address || '14 Adeola Odeku Way, Victoria Island, Lagos'}</p>
          </div>
          <a
            href={`https://maps.google.com/?q=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#15422D] hover:underline"
          >
            Open in Google Maps
          </a>
        </div>
        <div className="h-72 sm:h-80 w-full bg-[#EFECE4]">
          <iframe
            title="The Future Kitchen Location Map"
            src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
}
