export interface WarrantyCustomer {
  name: string;
  mobile: string;
  email: string;
  address: string;
  gstin?: string;
}

export interface WarrantyDetails {
  startDate: string;
  endDate: string;
  durationMonths: number;
  warrantyPeriodLabel: string;
  status: 'active' | 'expired' | 'void' | 'claimed' | string;
  termsAndConditions: string;
}

export interface WarrantyProductItem {
  id: string;
  productName: string;
  productCode: string;
  productCategory?: string;
  productSpecification?: string;
  productImage?: string;
  productSpecificWarranty?: string;
  amount?: number;
  gst?: number;
  gstAmount?: number;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
  warrantyPeriod?: string;
}

export interface WarrantySummary {
  totalProducts: number;
  subTotal: number;
  totalGst: number;
  grandTotal: number;
}

export interface WarrantyMetadata {
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  notes?: string;
}

export interface WarrantyRecord {
  id: string;
  orderNumber: string;
  warrantyNumber: string;
  quotationId?: string;
  customer: WarrantyCustomer;
  warranty: WarrantyDetails;
  products: WarrantyProductItem[];
  summary?: WarrantySummary;
  metadata?: WarrantyMetadata;
}

