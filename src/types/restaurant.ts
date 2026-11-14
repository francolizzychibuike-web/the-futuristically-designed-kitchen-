export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type FulfillmentType = 'delivery' | 'pickup';
export type PaymentMethod = 'pay_on_delivery' | 'pay_at_pickup' | 'paystack';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  price_ngn: number;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  prep_time_mins: number;
  spice_level: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  unit_price_ngn: number;
  quantity: number;
  line_total_ngn: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  fulfillment_type: FulfillmentType;
  special_instructions: string;
  subtotal_ngn: number;
  delivery_fee_ngn: number;
  total_ngn: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  created_at: string;
  moderated_at?: string | null;
}

export interface GalleryItem {
  id: number;
  title: string;
  category:
    | 'Nigerian Meals'
    | 'Restaurant Interior'
    | 'Food Preparation'
    | 'Grilled Dishes'
    | 'Drinks'
    | 'Special Presentations';
  image_url: string;
  caption: string;
  sort_order: number;
  created_at?: string;
}

export interface OpeningHour {
  days: string;
  hours: string;
}

export interface RestaurantSettings {
  id: number;
  business_name: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
  city: string;
  opening_hours: OpeningHour[];
  delivery_fee_ngn: number;
  free_delivery_threshold_ngn: number;
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  map_embed_query: string;
  paystack_enabled?: boolean;
  paystack_public_key?: string;
  paystack_mode?: 'test' | 'live';
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'manager';
  created_at: string;
  last_login_at: string | null;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
}
