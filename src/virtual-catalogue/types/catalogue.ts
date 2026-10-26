export interface Variant {
  code: string;               // e.g. "BB-6201"
  name?: string;              // e.g. "6201 (12x28x8)"
  price?: number;             // e.g. 2.90
  specs?: Record<string, string>; // e.g. { "d": "12 mm", "D": "28 mm", "B": "8 mm" }
  images: string[];           // Cloudinary public IDs, local paths, or inline SVGs
}

export interface Product {
  id: string;
  catalogueId: string;
  isSeries?: boolean;
  seriesCodeRange?: string;   // e.g. "BB-6201 ~ BB-6206"
  primaryCode: string;        // e.g. "BB-6204"
  name: string;               // e.g. "Deep Groove Ball Bearing 6200 Series"
  type: string;               // e.g. "Deep groove ball bearing"
  price: number;
  currency?: string;
  dimensions?: {
    d?: number;               // Bore (mm)
    D?: number;               // Outside Dia (mm)
    B?: number;               // Width (mm)
  };
  features: string[];
  summary: string;
  specs: Record<string, string>;
  images: string[];           // Default product images
  variants?: Variant[];       // When isSeries is true
  sheetPage?: number;
  sortOrder?: number;
}

export interface Catalogue {
  id: string;
  slug: string;
  title: string;
  brand: string;
  subtitle: string;
  currency: string;
  inquiryEmail?: string;
  inquiryWhatsApp?: string;
  coverImage?: string;
  itemCount?: number;
  featured?: boolean;
  order?: number;
}

export interface BrandConfig {
  brandName: string;
  tagline: string;
  logoUrl?: string;
  accentColor: string;
  supportPhone?: string;
  supportEmail?: string;
}

