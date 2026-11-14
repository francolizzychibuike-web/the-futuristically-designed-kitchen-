import React, { useState } from 'react';
import { Check, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import type { ContactMessage, GalleryItem, Review, ReviewStatus } from '../../types/restaurant.ts';
import { GALLERY_CATEGORIES } from '../../utils/restaurantLogic.ts';
import { ResilientImage } from '../ResilientImage.tsx';

interface AdminReviewsSectionProps {
  reviews: Review[];
  onModerateReview: (id: number, status: ReviewStatus) => Promise<void>;
  onDeleteReview: (id: number) => Promise<void>;
}

export function AdminReviewsSection({
  reviews,
  onModerateReview,
  onDeleteReview,
}: AdminReviewsSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-[#133827]">
        Customer Reviews Moderation ({reviews.length})
      </h2>
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E1D3] p-8 text-center text-sm text-[#5A665F]">
          No customer reviews submitted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <article key={review.id} className="bg-white rounded-xl border border-[#E8E1D3] p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sm text-[#17201B]">{review.customer_name}</h3>
                  <p className="text-xs text-[#5A665F]">
                    Status: <strong className="capitalize text-[#133827]">{review.status}</strong> ·{' '}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating ? 'fill-[#B88A3B] text-[#B88A3B]' : 'text-[#DCD4C4]'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-[#3D4A42]">{review.comment}</p>
              <div className="pt-2 border-t border-[#F0ECE3] flex flex-wrap gap-2">
                {review.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => onModerateReview(review.id, 'approved')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#15422D] text-white rounded-md hover:bg-[#0E2F20] cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => onModerateReview(review.id, 'rejected')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-[#DCD4C4] text-[#3D4A42] rounded-md hover:bg-[#FAF8F4] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteReview(review.id)}
                  aria-label={`Delete review by ${review.customer_name}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-[#FECACA] text-[#991B1B] rounded-md hover:bg-[#FEF2F2] cursor-pointer ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminGallerySectionProps {
  items: GalleryItem[];
  onAddGalleryItem: (payload: { title: string; category: string; image_url: string; caption: string }) => Promise<void>;
  onDeleteGalleryItem: (id: number) => Promise<void>;
  onUploadImage: (dataUrl: string) => Promise<string>;
}

export function AdminGallerySection({
  items,
  onAddGalleryItem,
  onDeleteGalleryItem,
  onUploadImage,
}: AdminGallerySectionProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(GALLERY_CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState('/assets/images/hero_jollof_feast_1794680375338.jpg');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const url = await onUploadImage(dataUrl);
      setImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddGalleryItem({ title, category, image_url: imageUrl, caption });
    setTitle('');
    setCaption('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-[#133827]">Add Gallery Photograph</h2>
        <div className="space-y-1">
          <label htmlFor="gal-title" className="block text-xs font-semibold">Title *</label>
          <input
            id="gal-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday Night Suya Grill"
            className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="gal-cat" className="block text-xs font-semibold">Category</label>
          <select
            id="gal-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
          >
            {GALLERY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="gal-url" className="block text-xs font-semibold">Photograph URL or Upload</label>
          <div className="flex gap-2">
            <input
              id="gal-url"
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
            />
            <label className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-[#EFECE4] rounded-lg cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? '...' : 'Upload'}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="sr-only" />
            </label>
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="gal-cap" className="block text-xs font-semibold">Caption</label>
          <textarea
            id="gal-cap"
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add to Gallery
        </button>
      </form>

      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-[#E8E1D3] overflow-hidden flex flex-col">
            <ResilientImage src={item.image_url} alt={item.title} className="h-44 w-full object-cover" />
            <div className="p-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-[#9F742B] font-medium">{item.category}</p>
                <p className="font-semibold text-sm text-[#133827]">{item.title}</p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteGalleryItem(item.id)}
                aria-label={`Delete gallery item ${item.title}`}
                className="p-2 text-[#991B1B] hover:bg-[#FEF2F2] rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AdminMessagesSectionProps {
  messages: ContactMessage[];
  onUpdateMessageStatus: (id: number, status: 'unread' | 'read' | 'replied') => Promise<void>;
}

export function AdminMessagesSection({ messages, onUpdateMessageStatus }: AdminMessagesSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-[#133827]">
        Customer Contact Messages ({messages.length})
      </h2>
      {messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E1D3] p-8 text-center text-sm text-[#5A665F]">
          No contact inquiries yet.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-xl border border-[#E8E1D3] p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sm text-[#133827]">
                    {msg.name} · <span className="font-normal text-[#5A665F]">{msg.email}</span>
                  </h3>
                  <p className="text-xs text-[#9F742B] font-medium">
                    {msg.subject} · {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                <select
                  aria-label={`Status for message from ${msg.name}`}
                  value={msg.status}
                  onChange={(e) =>
                    onUpdateMessageStatus(msg.id, e.target.value as 'unread' | 'read' | 'replied')
                  }
                  className="px-2.5 py-1 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-md"
                >
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
              </div>
              <p className="text-sm text-[#3D4A42]">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
