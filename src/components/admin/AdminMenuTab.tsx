import React, { useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import type { Category, Product } from '../../types/restaurant.ts';
import { formatNaira } from '../../utils/restaurantLogic.ts';
import { ResilientImage } from '../ResilientImage.tsx';

interface AdminMenuTabProps {
  categories: Category[];
  products: Product[];
  onSaveProduct: (payload: Partial<Product>, editId?: number) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
  onUploadImage: (dataUrl: string) => Promise<string>;
}

export function AdminMenuTab({
  categories,
  products,
  onSaveProduct,
  onDeleteProduct,
  onUploadImage,
}: AdminMenuTabProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [description, setDescription] = useState('');
  const [priceNgn, setPriceNgn] = useState('');
  const [imageUrl, setImageUrl] = useState('/assets/images/hero_jollof_feast_1794680375338.jpg');
  const [prepTimeMins, setPrepTimeMins] = useState('25');
  const [spiceLevel, setSpiceLevel] = useState('Medium');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategoryId(categories[0]?.id || 1);
    setDescription('');
    setPriceNgn('');
    setImageUrl('/assets/images/hero_jollof_feast_1794680375338.jpg');
    setPrepTimeMins('25');
    setSpiceLevel('Medium');
    setIsAvailable(true);
    setIsFeatured(false);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategoryId(product.category_id);
    setDescription(product.description);
    setPriceNgn(String(product.price_ngn));
    setImageUrl(product.image_url);
    setPrepTimeMins(String(product.prep_time_mins));
    setSpiceLevel(product.spice_level);
    setIsAvailable(product.is_available);
    setIsFeatured(product.is_featured);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const uploadedUrl = await onUploadImage(dataUrl);
      setImageUrl(uploadedUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProduct(
        {
          name,
          category_id: Number(categoryId),
          description,
          price_ngn: Number(priceNgn),
          image_url: imageUrl,
          prep_time_mins: Number(prepTimeMins) || 25,
          spice_level: spiceLevel,
          is_available: isAvailable,
          is_featured: isFeatured,
        },
        editingId ?? undefined
      );
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Add / Edit Meal Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#133827]">
            {editingId ? 'Edit Meal' : 'Add New Meal'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-[#5A665F] hover:underline cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="meal-name" className="block text-xs font-semibold text-[#17201B]">
            Dish Name *
          </label>
          <input
            id="meal-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Peppered Catfish & Boiled Yam"
            className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="meal-cat" className="block text-xs font-semibold text-[#17201B]">
              Category *
            </label>
            <select
              id="meal-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="meal-price" className="block text-xs font-semibold text-[#17201B]">
              Price (₦ NGN) *
            </label>
            <input
              id="meal-price"
              type="number"
              min="100"
              required
              value={priceNgn}
              onChange={(e) => setPriceNgn(e.target.value)}
              placeholder="6500"
              className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="meal-desc" className="block text-xs font-semibold text-[#17201B]">
            Description *
          </label>
          <textarea
            id="meal-desc"
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe ingredients and accompaniments..."
            className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="meal-img-url" className="block text-xs font-semibold text-[#17201B]">
            Food Photograph (Upload or URL)
          </label>
          <div className="flex gap-2">
            <input
              id="meal-img-url"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
            />
            <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#EFECE4] text-[#133827] rounded-lg hover:bg-[#E5DFD3] cursor-pointer whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} className="sr-only" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="meal-prep" className="block text-xs font-semibold text-[#17201B]">
              Prep Time (mins)
            </label>
            <input
              id="meal-prep"
              type="number"
              min="5"
              value={prepTimeMins}
              onChange={(e) => setPrepTimeMins(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="meal-spice" className="block text-xs font-semibold text-[#17201B]">
              Spice Level
            </label>
            <select
              id="meal-spice"
              value={spiceLevel}
              onChange={(e) => setSpiceLevel(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg"
            >
              <option value="None">None</option>
              <option value="Mild">Mild</option>
              <option value="Medium">Medium</option>
              <option value="Hot">Hot</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-1 text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 accent-[#15422D]"
            />
            <span>Available on menu</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 accent-[#15422D]"
            />
            <span>Featured on home</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20] cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{saving ? 'Saving...' : editingId ? 'Save Dish Changes' : 'Add Dish to Menu'}</span>
        </button>
      </form>

      {/* Menu Catalog Table */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-[#E8E1D3] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E1D3]">
          <h3 className="font-display text-lg font-bold text-[#133827]">Menu Items ({products.length})</h3>
        </div>
        <div className="divide-y divide-[#F0ECE3]">
          {products.map((product) => (
            <div key={product.id} className="p-4 flex items-center gap-4">
              <ResilientImage
                src={product.image_url}
                alt={product.name}
                className="w-16 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-[#17201B] truncate">{product.name}</h4>
                  {!product.is_available && (
                    <span className="text-xs text-[#991B1B] font-medium">· Sold Out</span>
                  )}
                </div>
                <p className="text-xs text-[#5A665F]">
                  {product.category_name} ·{' '}
                  <span className="font-mono tabular-nums text-[#133827] font-semibold">
                    {formatNaira(product.price_ngn)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(product)}
                  aria-label={`Edit ${product.name}`}
                  className="p-2 rounded-lg border border-[#DCD4C4] text-[#133827] hover:bg-[#FAF8F4] cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteProduct(product.id)}
                  aria-label={`Delete ${product.name}`}
                  className="p-2 rounded-lg border border-[#FECACA] text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
