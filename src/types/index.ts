export interface User {
  uid: string;
  email: string;
  displayName?: string;
  profileImage?: string;
  phone?: string;
  address?: string;
  company?: string;
  website?: string;
  bio?: string;
  role: 'admin' | 'employee' | 'customer' | 'editor' | 'viewer' | 'production';
  createdAt: string;
  emailVerified?: boolean;
}

export interface Reviewer {
  profilePhotoUrl?: string;
  displayName: string;
}

export interface Review {
  id: string;
  reviewer: Reviewer;
  starRating: number;
  comment: string;
  createTime: string;
  reviewReply?: { comment: string };
  source: "google" | "website";
  title?: string;
  userName?: string;
  userImage?: string;
}

export interface ReviewsProps {
  localReviews: Array<{
    id: string;
    userName: string;
    userImage?: string;
    rating: number;
    content: string;
    createdAt: string;
    title?: string;
  }>;
}

export type OurWorkItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
};

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  userId: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'damage' | 'return' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  performedBy: string;
  performedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}


export interface InventoryGroup {
  id: string;
  name: string;
  description: string;
  groupTag: string;
  color: string;
  items: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GoogleSheetsSync {
  id: string;
  action: 'create' | 'update' | 'delete';
  itemId: string;
  data: any;
  status: 'pending' | 'synced' | 'failed';
  timestamp: string;
  performedBy: string;
  error?: string;
}

export interface StockGroup {
  id: string;
  name: string;
  description: string;
  categories: string[];
  assignedEmployees: string[];
  permissions: {
    canAdd: boolean;
    canReduce: boolean;
    canAdjust: boolean;
    canViewReports: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  assignedStockGroups: string[];
  permissions: {
    canManageInventory: boolean;
    canViewReports: boolean;
    canProcessOrders: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  subject: string;
  content: string;
  isRead: boolean;
  parentMessageId?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  rating: number;
  title: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  respondedAt?: string;
  response?: string;
}

export interface SiteContent {
  id: string;
  section: 'header' | 'footer' | 'hero' | 'about';
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  image: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  id: string;
  category: 'general' | 'contact' | 'social' | 'seo' | 'store';
  key: string;
  value: string;
  type: 'text' | 'email' | 'url' | 'textarea' | 'image' | 'boolean';
  label: string;
  description?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: 'normal' | 'wooden';

  customerName: string;
  customerEmail?: string;
  customerPhone?: string;

  // Common fields
  width: number;
  height: number;
  quantity: number;

  // Normal Blinds specific
  fabricCode?: string;
  imageUrl?: string;

  // Wooden Blinds specific
  baseSize?: '35mm' | '50mm';
  woodenColorCode?: string;
  numberOfSlats?: number;
  tiltCordLength?: number;
  cordLength?: number;
  ladderTapeSize?: number;
  msRoad?: number;
  channelUching?: number;
  channelUchingCm?: number;
  operatingSide?: 'left' | 'right';

  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface ProductSKU {
  id: string;
  sku: string;
  name: string;
  category: 'normal' | 'wooden';
  imageUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
