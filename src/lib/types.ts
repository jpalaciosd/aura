export type Role = "client" | "admin";

export type AppointmentStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentStatus =
  | "pending_ai"
  | "auto_approved"
  | "manual_review"
  | "manual_approved"
  | "rejected";

export interface DbUser {
  id: string;
  google_id: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbService {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  base_price: number;
  icon: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbAvailability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  active: boolean;
}

export interface DbBlockedSlot {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
}

export interface DbAppointment {
  id: string;
  customer_id: string;
  service_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  total_price: number;
  discount_amount: number;
  coupon_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptAiData {
  monto?: number;
  titular?: string;
  last4?: string;
  fecha?: string;
  referencia?: string;
  confianza: number;
  motivos_duda?: string[];
}

export interface DbPayment {
  id: string;
  appointment_id: string;
  customer_id: string;
  amount_expected: number;
  receipt_url: string | null;
  ai_data: ReceiptAiData | null;
  status: PaymentStatus;
  decision_reason: string | null;
  reviewer_id: string | null;
  redemption_code: string | null;
  coupon_code: string | null;
  discount_applied: number;
  original_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbCoupon {
  code: string;
  description: string | null;
  discount_percent: number;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  one_per_user: boolean;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBeforeAfter {
  id: string;
  service_id: string | null;
  title: string;
  description: string | null;
  before_url: string;
  after_url: string;
  sessions_count: number | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface DbTestimonial {
  id: string;
  customer_name: string;
  customer_avatar_url: string | null;
  service_id: string | null;
  text: string;
  rating: number;
  photo_url: string | null;
  sort_order: number;
  featured: boolean;
  created_at: string;
}
