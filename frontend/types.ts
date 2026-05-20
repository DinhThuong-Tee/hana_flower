export interface Product {
  _id: string;
  name: string;
  price: number;
  original_price?: number;
  description: string;
  categories: string[];
  images: string[];
  is_stock: boolean;
  seo_meta: {
    title: string;
    description: string;
    alt_text: string;
  };
  flash_sale?: {
    sale_price: number;
    end_time: string;
  };
}

export interface FlashSale {
  _id: string;
  product_id: string;
  sale_price: number;
  start_time: string;
  end_time: string;
}

export interface Review {
  _id: string;
  product_id: string;
  order_id?: string;
  user_name: string;
  rating: number;
  comment: string;
  images: string[];
  is_approved: boolean;
  created_at: string;
}

export interface Order {
  _id: string;
  order_code: string;
  customer_info: {
    name: string;
    phone: string;
    address: string;
  };
  user_id?: string;
  account_name?: string;
  delivery_details: {
    date: string;
    time_slot: string;
    card_message: string;
  };
  items: Array<{
    product_id: string;
    quantity: number;
    price_at_purchase: number;
  }>;
  total_amount: number;
  payment_status: "unpaid" | "paid";
  order_status: "pending" | "shipping" | "completed" | "cancelled";
  payment_method: string;
  payment_receipt?: string;
  created_at: string;
}
