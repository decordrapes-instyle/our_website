import { Catalogue, Product } from '../types/catalogue';
import { generateBearingSvg } from '../utils/svgBearings';
import { generateZebraBlindSvg } from '../utils/svgBlinds';

export const INITIAL_CATALOGUES: Catalogue[] = [
  {
    id: 'cat_zebra_blinds',
    slug: 'zebra-blinds',
    title: 'Custom Zebra Blinds & Motorized Shades',
    brand: 'Decor Drapes Instyle',
    subtitle: 'Dual Layer Day & Night Light Filtering & Blackout Shades',
    currency: '₹',
    inquiryEmail: 'info@decordrapes.com',
    inquiryWhatsApp: '+919876543210',
    itemCount: 4,
    featured: true,
    order: 1
  },
  {
    id: 'cat_bearings',
    slug: 'bearings',
    title: 'Industrial Bearings Master Catalogue',
    brand: 'Apex Motion Systems',
    subtitle: 'Deep Groove, Cylindrical Roller & Thrust Series',
    currency: '₹',
    inquiryEmail: 'sales@apexmotion.com',
    inquiryWhatsApp: '+919876543210',
    itemCount: 6,
    featured: true,
    order: 2
  },
  {
    id: 'cat_fasteners',
    slug: 'fasteners',
    title: 'High-Tensile Fasteners & Hardware',
    brand: 'Apex Fastening Co.',
    subtitle: 'Grade 8.8, 10.9 & Stainless Steel Solutions',
    currency: '₹',
    inquiryEmail: 'fasteners@apexmotion.com',
    inquiryWhatsApp: '+919876543210',
    itemCount: 4,
    featured: true,
    order: 3
  },
  {
    id: 'cat_hydraulics',
    slug: 'hydraulics',
    title: 'Precision Hydraulic Fittings & Seals',
    brand: 'Apex Fluid Power',
    subtitle: 'SAE, JIC & BSP High Pressure Line Parts',
    currency: '₹',
    inquiryEmail: 'fluid@apexmotion.com',
    inquiryWhatsApp: '+919876543210',
    itemCount: 8,
    featured: false,
    order: 4
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_zb_600',
    catalogueId: 'cat_zebra_blinds',
    isSeries: true,
    seriesCodeRange: 'ZB-601 ~ ZB-605',
    primaryCode: 'ZB-601',
    name: 'Dual Day & Night Zebra Sheer Blinds',
    type: 'Dual-Layer Roller Blind',
    price: 1850.00,
    currency: '₹',
    dimensions: { d: 60, D: 240, B: 85 },
    features: [
      'Dual layer alternating sheer and solid stripes',
      '100% UV block & privacy control on demand',
      'Curved aluminum cassette with silent bottom rail',
      'Anti-static dust-repellent woven fabric'
    ],
    summary: 'Custom-fit zebra dual shades designed for contemporary residential and executive office windows. Seamlessly transitions between transparent daylight diffusion and complete nighttime blackout.',
    specs: {
      'Fabric Composition': '100% High-Density Polyester',
      'Stripe Repeat': 'Solid 75mm / Sheer 50mm',
      'Cassette Headbox': 'Curved 85mm Powder-Coated Aluminum',
      'Control System': 'Silent Stainless Chain / Motorized Option',
      'Light Fastness': 'Grade 5-6 (ISO 105-B02)',
      'Cleaning Care': 'Feather duster or damp microfiber sponge wipe'
    },
    images: [
      generateZebraBlindSvg('Silver Pearl', 1, 'grey'),
      generateZebraBlindSvg('Silver Pearl', 2, 'grey'),
      generateZebraBlindSvg('Silver Pearl', 3, 'grey'),
      generateZebraBlindSvg('Silver Pearl', 4, 'grey'),
      generateZebraBlindSvg('Silver Pearl', 5, 'grey')
    ],
    variants: [
      {
        code: 'ZB-601',
        name: 'ZB-601 (Silver Pearl)',
        price: 1850.00,
        specs: { 'Color': 'Silver Pearl Grey', 'Opacity': 'Room Darkening 85%', 'Fabric': 'Polyester Duo' },
        images: [generateZebraBlindSvg('Silver Pearl', 1, 'grey'), generateZebraBlindSvg('Silver Pearl', 2, 'grey')]
      },
      {
        code: 'ZB-602',
        name: 'ZB-602 (Warm Linen)',
        price: 1950.00,
        specs: { 'Color': 'Warm Sand Linen', 'Opacity': 'Daylight Filtering 75%', 'Fabric': 'Natural Textured Poly' },
        images: [generateZebraBlindSvg('Warm Linen', 1, 'linen'), generateZebraBlindSvg('Warm Linen', 2, 'linen')]
      },
      {
        code: 'ZB-603',
        name: 'ZB-603 (Slate Charcoal)',
        price: 2150.00,
        specs: { 'Color': 'Slate Charcoal', 'Opacity': 'Total Blackout 100%', 'Fabric': 'Thermal Insulated Blackout' },
        images: [generateZebraBlindSvg('Slate Charcoal', 1, 'charcoal'), generateZebraBlindSvg('Slate Charcoal', 3, 'charcoal')]
      },
      {
        code: 'ZB-604',
        name: 'ZB-604 (Cloud White)',
        price: 1850.00,
        specs: { 'Color': 'Cloud White', 'Opacity': 'Soft Glow 70%', 'Fabric': 'Pure White Satin Weave' },
        images: [generateZebraBlindSvg('Cloud White', 1, 'white'), generateZebraBlindSvg('Cloud White', 2, 'white')]
      },
      {
        code: 'ZB-605',
        name: 'ZB-605 (Mocha Walnut)',
        price: 2250.00,
        specs: { 'Color': 'Mocha Walnut', 'Opacity': 'Total Blackout 100%', 'Fabric': 'Heavy Jacquard Weave' },
        images: [generateZebraBlindSvg('Mocha Walnut', 3, 'linen'), generateZebraBlindSvg('Mocha Walnut', 5, 'linen')]
      }
    ],
    sheetPage: 1,
    sortOrder: 1
  },
  {
    id: 'prod_zb_smart_motor',
    catalogueId: 'cat_zebra_blinds',
    isSeries: false,
    primaryCode: 'ZB-SMART-50',
    name: 'Smart WiFi Motorized Zebra Blind System',
    type: 'Rechargeable Tubular Motor Blind',
    price: 3450.00,
    currency: '₹',
    dimensions: { d: 50, D: 280, B: 90 },
    features: [
      'Built-in lithium rechargeable motor (6-month battery)',
      'Tuya / Alexa / Google Assistant smart voice control',
      'Ultra quiet motor running under 30dB',
      'Scheduled automatic sunrise/sunset timers'
    ],
    summary: 'Next-generation motorized zebra window blind with integrated rechargeable battery motor, RF 433MHz remote control, and direct smartphone WiFi app integration.',
    specs: {
      'Motor Type': 'Rechargeable 12V DC Tubular Motor',
      'Battery Capacity': '2600 mAh (USB Type-C Charging)',
      'Torque / Speed': '1.1 Nm / 28 RPM',
      'Noise Level': '< 30 dB Silent Drive',
      'Smart Protocols': 'WiFi 2.4GHz + RF 433MHz + Tuya Smart Life',
      'Included Hardware': 'Top Valance, USB-C Cable, Magnetic Remote'
    },
    images: [
      generateZebraBlindSvg('Smart Motor System', 4, 'charcoal'),
      generateZebraBlindSvg('Smart Motor System', 1, 'charcoal'),
      generateZebraBlindSvg('Smart Motor System', 2, 'charcoal'),
      generateZebraBlindSvg('Smart Motor System', 5, 'charcoal')
    ],
    sheetPage: 1,
    sortOrder: 2
  },
  {
    id: 'prod_bb_6200',
    catalogueId: 'cat_bearings',
    isSeries: true,
    seriesCodeRange: 'BB-6201 ~ BB-6206',
    primaryCode: 'BB-6204',
    name: 'Deep Groove Ball Bearing 6200 Series',
    type: 'Single Row Deep Groove',
    price: 420.00,
    currency: '₹',
    dimensions: { d: 20, D: 47, B: 14 },
    features: [
      'Chrome steel 52100 hardened alloy',
      'Pressed steel cage with standard clearance',
      'Ultra quiet, low friction running'
    ],
    summary: 'Standard industrial series engineered for motors, pumps, gearboxes, and automated assemblies.',
    specs: {
      'Bore (d)': '20 mm (series 12-30mm)',
      'Outside Dia (D)': '47 mm (series 28-62mm)',
      'Width (B)': '14 mm (series 8-16mm)',
      'Dynamic Load (C)': '13.5 kN',
      'Limiting Speed': '18,000 rpm',
      'Weight': '0.11 kg',
      'Material': 'GCr15 High Carbon Chrome Steel'
    },
    images: [
      generateBearingSvg({ d: 20, D: 47, B: 14 }, 1, 1),
      generateBearingSvg({ d: 20, D: 47, B: 14 }, 2, 1),
      generateBearingSvg({ d: 20, D: 47, B: 14 }, 3, 1),
      generateBearingSvg({ d: 20, D: 47, B: 14 }, 4, 1),
      generateBearingSvg({ d: 20, D: 47, B: 14 }, 5, 1)
    ],
    variants: [
      {
        code: 'BB-6201',
        name: '6201 (12x28x8)',
        price: 290.00,
        specs: { 'Bore': '12 mm', 'OD': '28 mm', 'Width': '8 mm', 'Load': '5.1 kN' },
        images: [generateBearingSvg({ d: 12, D: 28, B: 8 }, 1, 0), generateBearingSvg({ d: 12, D: 28, B: 8 }, 2, 0)]
      },
      {
        code: 'BB-6202',
        name: '6202 (15x35x11)',
        price: 340.00,
        specs: { 'Bore': '15 mm', 'OD': '35 mm', 'Width': '11 mm', 'Load': '7.8 kN' },
        images: [generateBearingSvg({ d: 15, D: 35, B: 11 }, 1, 2)]
      },
      {
        code: 'BB-6204',
        name: '6204 (20x47x14)',
        price: 420.00,
        specs: { 'Bore': '20 mm', 'OD': '47 mm', 'Width': '14 mm', 'Load': '13.5 kN' },
        images: [generateBearingSvg({ d: 20, D: 47, B: 14 }, 1, 1), generateBearingSvg({ d: 20, D: 47, B: 14 }, 2, 1)]
      },
      {
        code: 'BB-6205',
        name: '6205 (25x52x15)',
        price: 560.00,
        specs: { 'Bore': '25 mm', 'OD': '52 mm', 'Width': '15 mm', 'Load': '14.0 kN' },
        images: [generateBearingSvg({ d: 25, D: 52, B: 15 }, 1, 3)]
      },
      {
        code: 'BB-6206',
        name: '6206 (30x62x16)',
        price: 680.00,
        specs: { 'Bore': '30 mm', 'OD': '62 mm', 'Width': '16 mm', 'Load': '20.3 kN' },
        images: [generateBearingSvg({ d: 30, D: 62, B: 16 }, 1, 4)]
      }
    ],
    sheetPage: 1,
    sortOrder: 1
  },
  {
    id: 'prod_bb_6305',
    catalogueId: 'cat_bearings',
    isSeries: false,
    primaryCode: 'BB-6305',
    name: 'Heavy Series Radial Bearing 6305',
    type: 'Deep groove ball bearing',
    price: 750.00,
    currency: '₹',
    dimensions: { d: 25, D: 62, B: 17 },
    features: [
      'Heavy series wall construction',
      'High radial load rating',
      'Precision ground raceways'
    ],
    summary: 'Heavy series built for demanding radial loads and continuous motor operating duty.',
    specs: {
      'Bore (d)': '25 mm',
      'Outside Dia (D)': '62 mm',
      'Width (B)': '17 mm',
      'Dynamic Load (C)': '23.4 kN',
      'Limiting Speed': '15,000 rpm',
      'Weight': '0.23 kg',
      'Material': 'Chrome Steel 52100'
    },
    images: [
      generateBearingSvg({ d: 25, D: 62, B: 17 }, 1, 2),
      generateBearingSvg({ d: 25, D: 62, B: 17 }, 2, 2),
      generateBearingSvg({ d: 25, D: 62, B: 17 }, 3, 2),
      generateBearingSvg({ d: 25, D: 62, B: 17 }, 4, 2)
    ],
    sheetPage: 1,
    sortOrder: 2
  },
  {
    id: 'prod_rb_nu206',
    catalogueId: 'cat_bearings',
    isSeries: true,
    seriesCodeRange: 'RB-NU204 ~ RB-NU208',
    primaryCode: 'RB-NU206',
    name: 'Cylindrical Roller Bearing NU206',
    type: 'Cylindrical roller bearing',
    price: 1190.00,
    currency: '₹',
    dimensions: { d: 30, D: 62, B: 16 },
    features: [
      'Extremely high radial load tolerance',
      'Separable inner/outer rings for easy mounting',
      'Reinforced bronze / pressed steel cage'
    ],
    summary: 'Separable rings and maximum load capacity for heavy gear drives and conveyor systems.',
    specs: {
      'Bore (d)': '30 mm',
      'Outside Dia (D)': '62 mm',
      'Width (B)': '16 mm',
      'Dynamic Load (C)': '40.5 kN',
      'Limiting Speed': '11,000 rpm',
      'Weight': '0.21 kg',
      'Material': 'Case-Hardened Roller Steel'
    },
    images: [
      generateBearingSvg({ d: 30, D: 62, B: 16 }, 1, 3),
      generateBearingSvg({ d: 30, D: 62, B: 16 }, 2, 3),
      generateBearingSvg({ d: 30, D: 62, B: 16 }, 3, 3),
      generateBearingSvg({ d: 30, D: 62, B: 16 }, 4, 3)
    ],
    sheetPage: 2,
    sortOrder: 3
  },
  {
    id: 'prod_tb_51105',
    catalogueId: 'cat_bearings',
    isSeries: false,
    primaryCode: 'TB-51105',
    name: 'Single Direction Thrust Bearing 51105',
    type: 'Thrust ball bearing',
    price: 560.00,
    currency: '₹',
    dimensions: { d: 25, D: 42, B: 11 },
    features: [
      'Pure axial load application',
      'Interchangeable ground washers',
      'High-speed pressed cage'
    ],
    summary: 'Engineered solely for axial thrust loads with separable housing and shaft washers.',
    specs: {
      'Bore (d)': '25 mm',
      'Outside Dia (D)': '42 mm',
      'Width (B)': '11 mm',
      'Dynamic Load (C)': '14.6 kN',
      'Limiting Speed': '6,700 rpm',
      'Weight': '0.07 kg',
      'Material': 'High-Tensile Bearing Steel'
    },
    images: [
      generateBearingSvg({ d: 25, D: 42, B: 11 }, 1, 4),
      generateBearingSvg({ d: 25, D: 42, B: 11 }, 2, 4),
      generateBearingSvg({ d: 25, D: 42, B: 11 }, 3, 4)
    ],
    sheetPage: 2,
    sortOrder: 4
  }
];
