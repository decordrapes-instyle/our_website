import React, { useEffect, useMemo, useState } from 'react';
import { ref, onValue, push } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { InventoryItem, Quotation, QuotationItem } from '../types';
import { formatCurrency } from '../config/razorpay';
import { Calculator, Send, Plus, Trash2, Search, Ruler, X } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Helpers ---------------------------------------------------------------
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

// Convert a length value in a given unit to feet
const toFeet = (value: number, unit: string) => {
  const v = Number(value) || 0;
  switch (unit) {
    case 'inch': return v / 12;
    case 'cm': return v / 30.48;
    case 'mm': return v / 304.8;
    case 'm': return v * 3.2808399;
    case 'ft':
    default: return v;
  }
};

// --- Component -------------------------------------------------------------
const Estimate: React.FC = () => {
  const { currentUser } = useAuth();

  // inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  // quotation items
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);

  // form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  // sqft helper modal
  const [showSqftModal, setShowSqftModal] = useState(false);
  const [sqftTargetId, setSqftTargetId] = useState<string | null>(null);
  const [sqftForm, setSqftForm] = useState({ width: '', height: '', unit: 'ft' });

  // Animation states
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch inventory
  useEffect(() => {
    const inventoryRef = ref(database, 'inventory');
    const unsub = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() || {};
        const list: InventoryItem[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((item) => item.isActive && item.currentStock > 0);
        setInventory(list);
      } else {
        setInventory([]);
      }
    }, (err) => {
      console.error('Inventory listen error:', err);
      toast.error('Failed to load inventory');
    });
    return () => unsub();
  }, []);

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((item) =>
      item.name?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  }, [inventory, searchQuery]);

  // --- Pricing logic -------------------------------------------------------
  type BaseTax = { base: number; gst: number; total: number };

  const calcBaseGst = (item: QuotationItem): BaseTax => {
    // Handle both gst and gstRate fields for compatibility
    const gstRate = Number(item.gstRate ?? (item as any).gst ?? 0);
    
    let base = 0;

    if ((item.unitType || '').toLowerCase() === 'sqft') {
      const qtySqft = Number(item.quantity) || 0;
      const ppu = Number(item.pricePerUnit || item.unitPrice || 0);
      base = qtySqft * ppu;
    } else if ((item.unitType || '').toLowerCase() === 'meter' || (item.unitType || '').toLowerCase() === 'sqm') {
      const hasDims = item.width && item.height;
      const ppu = Number(item.pricePerUnit || item.unitPrice || 0);
      if (hasDims) {
        const areaSqm = Number(item.width) * Number(item.height);
        base = areaSqm * ppu;
      } else {
        base = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      }
    } else {
      base = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }

    const gst = (base * gstRate) / 100;
    const total = base + gst;
    return { base, gst, total };
  };

  const recalcItem = (item: QuotationItem): QuotationItem => {
    const { total } = calcBaseGst(item);
    return { 
      ...item, 
      total,
      area: (item.unitType || '').toLowerCase() === 'sqft' ? (Number(item.quantity) || 0) : 
            (item.width && item.height ? Number(item.width) * Number(item.height) : undefined),
    } as QuotationItem;
  };

  const calculateTotals = () => {
    const sums = selectedItems.reduce((acc, it) => {
      const { base, gst } = calcBaseGst(it);
      acc.subtotal += base;
      acc.tax += gst;
      return acc;
    }, { subtotal: 0, tax: 0 });

    return { ...sums, total: sums.subtotal + sums.tax };
  };

  // --- Item operations -----------------------------------------------------
  const addItemToQuotation = (inv: InventoryItem) => {
    const exists = selectedItems.find((si) => si.inventoryItemId === inv.id);
    const baseData: Partial<QuotationItem> = {
      id: Date.now().toString(),
      inventoryItemId: inv.id!,
      name: inv.name,
      description: inv.description,
      unitType: (inv.unitType as any) || inv.unit || 'piece',
      unitPrice: Number(inv.sellingPrice) || 0,
      pricePerUnit: Number(inv.pricePerUnit ?? inv.sellingPrice) || 0,
      // Ensure we capture GST rate correctly
      gstRate: Number((inv as any).gstRate ?? (inv as any).gst ?? 0),
    };

    if (exists) {
      const updated = selectedItems.map((si) =>
        si.inventoryItemId === inv.id ? recalcItem({ ...si, quantity: (Number(si.quantity) || 0) + 1 }) : si
      );
      setSelectedItems(updated);
    } else {
      const newItem = recalcItem({
        ...(baseData as QuotationItem),
        quantity: 1,
      });
      setSelectedItems((prev) => [...prev, newItem]);
    }

    setShowProductSearch(false);
    setSearchQuery('');
    toast.success('Product added to quotation');
  };

  const updateItemQuantity = (itemId: string, nextQty: number) => {
    const qty = clamp(Number(nextQty) || 0, 0, 1_000_000);
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((it) => it.id !== itemId));
      toast.success('Product removed from quotation');
      return;
    }
    setSelectedItems((prev) => prev.map((it) => (it.id === itemId ? recalcItem({ ...it, quantity: qty }) : it)));
  };

  const removeItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((it) => it.id !== itemId));
    toast.success('Product removed from quotation');
  };

  const openSqftModalFor = (itemId: string) => {
    const item = selectedItems.find(i => i.id === itemId);
    setSqftTargetId(itemId);
    // Pre-fill with existing dimensions if available
    setSqftForm({ 
      width: item?.width ? String(item.width) : '', 
      height: item?.height ? String(item.height) : '', 
      unit: 'ft' 
    });
    setShowSqftModal(true);
  };

  const applySqft = () => {
    if (!sqftTargetId) return setShowSqftModal(false);
    
    const wFt = toFeet(parseFloat(sqftForm.width), sqftForm.unit);
    const hFt = toFeet(parseFloat(sqftForm.height), sqftForm.unit);
    const sqft = Math.max(0, Number((wFt * hFt).toFixed(4)));

    setSelectedItems((prev) => prev.map((it) => {
      if (it.id !== sqftTargetId) return it;
      
      const isSqft = (it.unitType || '').toLowerCase() === 'sqft';
      const next = { ...it } as QuotationItem;
      
      if (isSqft) {
        // For sqft items, set quantity to the calculated sqft
        next.quantity = sqft;
      } else {
        // For other items, store dimensions and calculate quantity if needed
        next.width = wFt;
        next.height = hFt;
        
        if ((it.unitType || '').toLowerCase() === 'piece' && sqft > 0) {
          next.quantity = Math.max(1, Math.ceil(sqft / 10)); // Example logic
        }
      }
      
      return recalcItem(next);
    }));

    setShowSqftModal(false);
    setSqftTargetId(null);
    toast.success('Dimensions applied successfully');
  };

  // --- Submit --------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the quotation');
      return;
    }
    if (!formData.name || !formData.email) {
      toast.error('Please provide your name and email');
      return;
    }

    setLoading(true);
    try {
      const { subtotal, tax, total } = calculateTotals();

      const itemsToSave = selectedItems.map((it) => ({
        id: it.id,
        inventoryItemId: it.inventoryItemId,
        name: it.name,
        description: it.description || '',
        quantity: Number(it.quantity) || 0,
        unitType: it.unitType || 'piece',
        unitPrice: Number(it.unitPrice) || 0,
        pricePerUnit: Number(it.pricePerUnit) || 0,
        width: it.width ? Number(it.width) : null,
        height: it.height ? Number(it.height) : null,
        area: it.area ? Number(it.area) : null,
        gstRate: Number(it.gstRate) || 0,
        total: Number(it.total) || 0,
      }));

      const nowIso = new Date().toISOString();
      const quotationData: Omit<Quotation, 'id'> & { createdBy: string } = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        description: formData.description,
        items: itemsToSave as any,
        subtotal,
        tax,
        discount: 0,
        total,
        status: 'draft',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: formData.notes,
        createdBy: currentUser?.uid || 'guest',
        createdAt: nowIso,
        updatedAt: nowIso,
        paymentStatus: 'pending',
      } as any;

      const quotationsRef = ref(database, 'quotations');
      await push(quotationsRef, quotationData);

      toast.success("Quotation request sent successfully! We'll contact you within 24 hours.");
      setFormData({ name: '', email: '', phone: '', description: '', notes: '' });
      setSelectedItems([]);
    } catch (error) {
      console.error('Error submitting quotation:', error);
      toast.error('Failed to send quotation request');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const { subtotal, tax, total } = calculateTotals();

  // --- UI ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Calculator className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Get Your Estimate</h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Select products from our inventory and we'll provide you with a detailed quotation within 24 hours.
          </p>
        </div>

        {/* Form */}
        <div className={`bg-white rounded-lg shadow-md p-6 sm:p-8 transition-all duration-700 delay-100 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information with floating labels */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="peer w-full px-4 pt-5 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-transparent"
                    placeholder="Full Name"
                  />
                  <label htmlFor="name" className="absolute left-4 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base">
                    Full Name *
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="peer w-full px-4 pt-5 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-transparent"
                    placeholder="your.email@example.com"
                  />
                  <label htmlFor="email" className="absolute left-4 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base">
                    Email Address *
                  </label>
                </div>
              </div>
              <div className="mt-4 relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="peer w-full px-4 pt-5 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-transparent"
                  placeholder="+91 9876543210"
                />
                <label htmlFor="phone" className="absolute left-4 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base">
                  Phone Number
                </label>
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Products</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProductSearch(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Product
                  </button>
                </div>
              </div>

              {selectedItems.length > 0 ? (
                <div className="space-y-4">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                        <p className="text-sm font-medium text-blue-600">
                          {formatCurrency(Number(item.pricePerUnit || item.unitPrice))} per {item.unitType}
                        </p>
                        {(item.area || ((item.unitType || '').toLowerCase() === 'sqft' && item.quantity)) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Area (sqft): {(((item.unitType || '').toLowerCase() === 'sqft') ? Number(item.quantity) : Number(item.area || 0)).toFixed(2)}
                          </p>
                        )}
                        {item.gstRate !== undefined && item.gstRate > 0 && (
                          <p className="text-xs text-gray-500 mt-1">GST: {item.gstRate}%</p>
                        )}
                      </div>

                      {/* Quantity controls + sqft helper */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id!, (Number(item.quantity) || 0) - 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                            aria-label="decrease"
                          >-</button>
                          <div className="relative">
                            <input
                              type="number"
                              step={0.25}
                              min={0}
                              value={Number(item.quantity) || 0}
                              onChange={(e) => updateItemQuantity(item.id!, parseFloat(e.target.value))}
                              className="w-24 text-center border border-gray-200 rounded-md py-1 px-2"
                              aria-label="quantity"
                            />
                            {(item.unitType || '').toLowerCase() === 'sqft' && (
                              <span className="absolute -bottom-5 left-0 right-0 text-xs text-gray-500 text-center">sqft</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id!, (Number(item.quantity) || 0) + 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                            aria-label="increase"
                          >+</button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openSqftModalFor(item.id!)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-md border text-sm hover:bg-gray-50 transition-colors"
                          >
                            <Ruler className="w-4 h-4" /> Calculate area
                          </button>
                          <div className="text-right min-w-[110px]">
                            <p className="font-medium text-gray-900">{formatCurrency(Number(item.total) || 0)}</p>
                            {item.gstRate !== undefined && item.gstRate > 0 && (
                              <p className="text-xs text-gray-500">incl. GST</p>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeItem(item.id!)} 
                            className="text-red-600 hover:text-red-700 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal (before GST):</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST:</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600">No products selected. Click "Add Product" to get started.</p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="peer w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-transparent resize-none"
                  placeholder="Describe your requirements, timeline, or any special instructions..."
                />
                <label htmlFor="description" className="absolute left-4 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base">
                  Project Description
                </label>
              </div>
              <div className="relative">
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="peer w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-transparent resize-none"
                  placeholder="Any additional information or special requests..."
                />
                <label htmlFor="notes" className="absolute left-4 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base">
                  Additional Notes
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center shadow-md hover:shadow-lg"
              >
                {loading ? 'Sending Quotation Request...' : (<>
                  Send Quotation Request <Send className="w-4 h-4 ml-2" />
                </>)}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">You can submit a quote request without logging in.</p>
            </div>
          </form>
        </div>

        {/* Product Search Modal */}
        {showProductSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-hidden animate-scaleIn">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Select Products</h3>
                  <button 
                    onClick={() => setShowProductSearch(false)} 
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {filteredInventory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addItemToQuotation(item)}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.category} • SKU: {item.sku}</p>
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded mt-2" />
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-blue-600">{formatCurrency(Number(item.pricePerUnit ?? item.sellingPrice) || 0)}</p>
                        <p className="text-sm text-gray-500">per {(item.unitType as any) || item.unit}</p>
                        {((item as any).gstRate !== undefined || (item as any).gst !== undefined) && (
                          <p className="text-xs text-gray-500">GST {Number((item as any).gstRate ?? (item as any).gst)}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredInventory.length === 0 && (
                    <p className="text-center text-gray-600 py-8">No products found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Get Your Sqft Modal */}
        {showSqftModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg w-full max-w-md p-6 animate-scaleIn">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Calculate Area</h3>
                <button 
                  onClick={() => setShowSqftModal(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Enter width and height in your preferred units. We'll convert to square feet.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={sqftForm.width}
                    onChange={(e) => setSqftForm((s) => ({ ...s, width: e.target.value }))}
                    className="peer w-full px-3 pt-5 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-transparent"
                    placeholder="Width"
                  />
                  <label className="absolute left-3 top-2 text-gray-500 text-xs">Width</label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={sqftForm.height}
                    onChange={(e) => setSqftForm((s) => ({ ...s, height: e.target.value }))}
                    className="peer w-full px-3 pt-5 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-transparent"
                    placeholder="Height"
                  />
                  <label className="absolute left-3 top-2 text-gray-500 text-xs">Height</label>
                </div>
              </div>
              <select
                className="mt-3 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                value={sqftForm.unit}
                onChange={(e) => setSqftForm((s) => ({ ...s, unit: e.target.value }))}
              >
                <option value="ft">Feet (ft)</option>
                <option value="inch">Inches (in)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="mm">Millimeters (mm)</option>
                <option value="m">Meters (m)</option>
              </select>
              
              {sqftForm.width && sqftForm.height && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Calculated area: {(toFeet(parseFloat(sqftForm.width), sqftForm.unit) * toFeet(parseFloat(sqftForm.height), sqftForm.unit)).toFixed(2)} sqft
                  </p>
                </div>
              )}
              
              <button 
                onClick={applySqft} 
                disabled={!sqftForm.width || !sqftForm.height}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Apply to Item
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add custom animation styles */}
      <style >{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Estimate;