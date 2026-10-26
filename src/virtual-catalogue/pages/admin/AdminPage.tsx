import React, { useState, useEffect } from 'react';
import { Product, Catalogue, Variant } from '../../types/catalogue';
import {
  saveProduct,
  deleteProduct,
  bulkInsertProducts,
  saveCatalogue,
  deleteCatalogue,
} from '../../services/rtdb';
import { uploadImage, deleteStoredImages } from '../../services/imageStorage';
import { signInWithEmailPassword, signOut, getCurrentUser, AuthUser } from '../../services/auth';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Database,
  Folder,
  Plus,
  Trash2,
  Edit3,
  MoveUp,
  MoveDown,
  Upload,
  LogOut,
  ArrowLeft,
  Search,
  Check,
  Lock,
  Sun,
  Moon,
  GripVertical,
  X,
  Sparkles,
} from 'lucide-react';
import { generateBearingSvg } from '../../utils/svgBearings';

interface AdminPageProps {
  catalogues: Catalogue[];
  products: Product[];
  onRefresh: () => void;
  onExit: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  catalogues,
  products,
  onRefresh,
  onExit,
}) => {
  const toast = useToast();
  const { isDark, toggleDark } = useTheme();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentUser());

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Collection (Category)
  const [selectedCatalogueId, setSelectedCatalogueId] = useState<string>(
    catalogues[0]?.id || ''
  );

  // Search filter for leafs
  const [searchQuery, setSearchQuery] = useState('');

  // Inline Collection Creator / Editor
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Catalogue | null>(null);
  const [collectionForm, setCollectionForm] = useState({
    title: '',
    slug: '',
    brand: 'Decor Drapes Instyle',
    subtitle: '',
    currency: '₹',
    inquiryWhatsApp: '',
  });

  // Active Leaf Action: null | 'new-leaf' | 'series-builder' | 'edit-leaf'
  const [activeLeafAction, setActiveLeafAction] = useState<
    null | 'new-leaf' | 'series-builder' | 'edit-leaf'
  >(null);
  const [editingLeaf, setEditingLeaf] = useState<Product | null>(null);

  // Single Leaf Form State
  const [leafForm, setLeafForm] = useState({
    name: '',
    primaryCode: '',
    type: 'Standard Series',
    price: 420.0,
    currency: '₹',
    summary: 'Standard precision series engineered for motors, pumps and machinery.',
    features: 'Chrome steel 52100\nLow friction running\nHigh radial capacity',
    images: [] as string[],
    specs: { 'Material': 'Chrome Steel 52100', 'Standard': 'ISO 9001' } as Record<string, string>,
  });

  // Series Builder State (Starting Code, Ending Code, Skip Codes, Drag & Drop Images)
  const [seriesConfig, setSeriesConfig] = useState({
    prefix: 'BB-',
    startNum: 6201,
    endNum: 6206,
    skipCodes: '6203', // Comma separated numbers or codes to skip
    suffix: '',
    title: 'Ball Bearing 6200 Series',
    type: 'Deep groove ball bearing',
    basePrice: 420,
    priceIncrement: 50,
    summary: 'Standard precision series engineered for motors, pumps and machinery.',
    features: 'Chrome steel 52100\nLow friction running\nHigh radial capacity',
    specs: {
      'Category': 'Deep groove ball bearing',
      'Standard': 'Industrial Grade',
    } as Record<string, string>,
  });

  // Local helper states for editing overview highlights and technical specs
  const [newLeafFeature, setNewLeafFeature] = useState('');
  const [newSeriesFeature, setNewSeriesFeature] = useState('');

  // Ordered list of images for the series matching the codes count
  const [seriesImages, setSeriesImages] = useState<string[]>([]);
  const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);

  // Drag over target tracking for visual cues
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Upload progress
  const [isUploading, setIsUploading] = useState(false);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  // Sync selected catalogue id
  useEffect(() => {
    if (!selectedCatalogueId && catalogues.length > 0) {
      setSelectedCatalogueId(catalogues[0].id);
    }
  }, [catalogues, selectedCatalogueId]);

  // Compute generated series codes live based on start, end, prefix, and skip codes
  const computedSeriesCodes: string[] = React.useMemo(() => {
    const start = parseInt(String(seriesConfig.startNum)) || 0;
    const end = parseInt(String(seriesConfig.endNum)) || 0;
    if (end < start) return [];

    const skipSet = new Set(
      seriesConfig.skipCodes
        .split(/[\s,]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );

    const codes: string[] = [];
    for (let i = start; i <= end; i++) {
      const numStr = String(i);
      const fullCode = `${seriesConfig.prefix}${numStr}${seriesConfig.suffix}`;
      const isSkipped =
        skipSet.has(numStr.toLowerCase()) ||
        skipSet.has(fullCode.toLowerCase());

      if (!isSkipped) {
        codes.push(fullCode);
      }
    }
    return codes;
  }, [
    seriesConfig.prefix,
    seriesConfig.startNum,
    seriesConfig.endNum,
    seriesConfig.skipCodes,
    seriesConfig.suffix,
  ]);

  const activeCollection = catalogues.find((c) => c.id === selectedCatalogueId) || catalogues[0];
  const activeLeafs = products.filter((p) => p.catalogueId === selectedCatalogueId);

  // Ensure default offline SVGs if seriesImages is empty
  useEffect(() => {
    if (activeLeafAction === 'series-builder' && seriesImages.length === 0 && computedSeriesCodes.length > 0) {
      const initialSvgs = computedSeriesCodes.map((_, i) =>
        generateBearingSvg({ d: 15 + i * 2, D: 35 + i * 4, B: 11 + i }, 1, i)
      );
      setSeriesImages(initialSvgs);
    }
  }, [activeLeafAction, computedSeriesCodes]);

  const filteredLeafs = activeLeafs.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.primaryCode.toLowerCase().includes(q) ||
      p.seriesCodeRange?.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    );
  });

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const user = await signInWithEmailPassword(loginEmail, loginPassword);
      setCurrentUser(user);
      toast.success(`Connected as ${user.email}`);
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    signOut();
    setCurrentUser(null);
    toast.info('Session disconnected');
  };

  // ==========================================
  // COLLECTION (CATEGORY) INLINE ACTIONS
  // ==========================================
  const handleOpenAddCollection = () => {
    setEditingCollection(null);
    setCollectionForm({
      title: '',
      slug: '',
      brand: activeCollection?.brand || 'Decor Drapes Instyle',
      subtitle: '',
      currency: '₹',
      inquiryWhatsApp: '+919876543210',
    });
    setIsAddingCollection(true);
  };

  const handleOpenEditCollection = (cat: Catalogue, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCollection(cat);
    setCollectionForm({
      title: cat.title,
      slug: cat.slug,
      brand: cat.brand,
      subtitle: cat.subtitle,
      currency: cat.currency || '₹',
      inquiryWhatsApp: cat.inquiryWhatsApp || '',
    });
    setIsAddingCollection(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionForm.title.trim()) {
      toast.error('Collection title required');
      return;
    }

    const slug =
      collectionForm.slug.trim() ||
      collectionForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const cat: Catalogue = {
      id: editingCollection ? editingCollection.id : `cat_${Date.now()}`,
      title: collectionForm.title.trim(),
      slug,
      brand: collectionForm.brand.trim() || 'Decor Drapes Instyle',
      subtitle: collectionForm.subtitle.trim(),
      currency: collectionForm.currency.trim() || '₹',
      inquiryWhatsApp: collectionForm.inquiryWhatsApp.trim(),
      itemCount: activeLeafs.length,
      featured: true,
      order: catalogues.length + 1,
    };

    try {
      await saveCatalogue(cat);
      toast.success(`Collection "${cat.title}" saved`);
      onRefresh();
      setSelectedCatalogueId(cat.id);
      setIsAddingCollection(false);
      setEditingCollection(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save collection');
    }
  };

  const triggerDeleteCollection = (cat: Catalogue, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: `Delete Collection "${cat.title}"?`,
      message: `Are you sure? All leaf products under this collection and their uploaded media files will be deleted.`,
      action: async () => {
        try {
          // Clean public directory images for all products in this collection
          const collectionProducts = products.filter((p) => p.catalogueId === cat.id);
          const imagesToDelete: string[] = [];
          for (const p of collectionProducts) {
            if (p.images) imagesToDelete.push(...p.images);
            if (p.variants) {
              for (const v of p.variants) {
                if (v.images) imagesToDelete.push(...v.images);
              }
            }
          }
          if (imagesToDelete.length > 0) {
            await deleteStoredImages(imagesToDelete);
          }

          await deleteCatalogue(cat.id);
          toast.success(`Deleted collection "${cat.title}"`);
          onRefresh();
          const remaining = catalogues.filter((c) => c.id !== cat.id);
          if (remaining.length > 0) setSelectedCatalogueId(remaining[0].id);
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  // ==========================================
  // SINGLE LEAF INLINE CREATION / EDITING
  // ==========================================
  const handleOpenAddLeaf = () => {
    setEditingLeaf(null);
    setLeafForm({
      name: '',
      primaryCode: '',
      type: activeCollection?.title || 'Industrial Leaf',
      price: 420.0,
      currency: activeCollection?.currency || '₹',
      summary: '',
      features: 'High precision running\nHeat treated steel\nLow friction',
      images: [generateBearingSvg({ d: 20, D: 47, B: 14 }, 1, 1)],
      specs: { 'Material': 'Chrome Steel 52100', 'Standard': 'ISO 9001' },
    });
    setActiveLeafAction('new-leaf');
  };

  const handleOpenEditLeaf = (leaf: Product) => {
    setEditingLeaf(leaf);
    setLeafForm({
      name: leaf.name,
      primaryCode: leaf.primaryCode,
      type: leaf.type,
      price: leaf.price,
      currency: leaf.currency || '₹',
      summary: leaf.summary || '',
      features: leaf.features?.join('\n') || '',
      images: leaf.images || [],
      specs: leaf.specs || {},
    });
    setActiveLeafAction('edit-leaf');
    setNewLeafFeature('');
  };

  // Helper actions for Leaf features and technical specifications
  const addLeafFeature = () => {
    if (!newLeafFeature.trim()) return;
    const current = leafForm.features ? leafForm.features.split('\n') : [];
    current.push(newLeafFeature.trim());
    setLeafForm((prev) => ({ ...prev, features: current.join('\n') }));
    setNewLeafFeature('');
  };

  const removeLeafFeature = (idx: number) => {
    const current = leafForm.features ? leafForm.features.split('\n') : [];
    current.splice(idx, 1);
    setLeafForm((prev) => ({ ...prev, features: current.join('\n') }));
  };

  const handleLeafSpecKeyChange = (oldKey: string, newKey: string) => {
    setLeafForm((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev.specs || {})) {
        if (k === oldKey) {
          next[newKey] = v;
        } else {
          next[k] = v;
        }
      }
      return { ...prev, specs: next };
    });
  };

  const handleLeafSpecValChange = (key: string, val: string) => {
    setLeafForm((prev) => ({
      ...prev,
      specs: { ...(prev.specs || {}), [key]: val },
    }));
  };

  const addLeafSpecRow = () => {
    setLeafForm((prev) => {
      const existing = Object.keys(prev.specs || {});
      let key = 'Specification';
      let c = 1;
      while (existing.includes(key)) {
        key = `Specification ${c++}`;
      }
      return {
        ...prev,
        specs: { ...(prev.specs || {}), [key]: '' },
      };
    });
  };

  const deleteLeafSpecRow = (keyToDelete: string) => {
    setLeafForm((prev) => {
      const next = { ...(prev.specs || {}) };
      delete next[keyToDelete];
      return { ...prev, specs: next };
    });
  };

  // Helper actions for Series features and technical specifications
  const addSeriesFeature = () => {
    if (!newSeriesFeature.trim()) return;
    const current = seriesConfig.features ? seriesConfig.features.split('\n') : [];
    current.push(newSeriesFeature.trim());
    setSeriesConfig((prev) => ({ ...prev, features: current.join('\n') }));
    setNewSeriesFeature('');
  };

  const removeSeriesFeature = (idx: number) => {
    const current = seriesConfig.features ? seriesConfig.features.split('\n') : [];
    current.splice(idx, 1);
    setSeriesConfig((prev) => ({ ...prev, features: current.join('\n') }));
  };

  const handleSeriesSpecKeyChange = (oldKey: string, newKey: string) => {
    setSeriesConfig((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev.specs || {})) {
        if (k === oldKey) {
          next[newKey] = v;
        } else {
          next[k] = v;
        }
      }
      return { ...prev, specs: next };
    });
  };

  const handleSeriesSpecValChange = (key: string, val: string) => {
    setSeriesConfig((prev) => ({
      ...prev,
      specs: { ...(prev.specs || {}), [key]: val },
    }));
  };

  const addSeriesSpecRow = () => {
    setSeriesConfig((prev) => {
      const existing = Object.keys(prev.specs || {});
      let key = 'Specification';
      let c = 1;
      while (existing.includes(key)) {
        key = `Specification ${c++}`;
      }
      return {
        ...prev,
        specs: { ...(prev.specs || {}), [key]: '' },
      };
    });
  };

  const deleteSeriesSpecRow = (keyToDelete: string) => {
    setSeriesConfig((prev) => {
      const next = { ...(prev.specs || {}) };
      delete next[keyToDelete];
      return { ...prev, specs: next };
    });
  };

  const handleSaveLeaf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leafForm.primaryCode.trim()) {
      toast.error('Primary Code required');
      return;
    }

    const newProduct: Product = {
      id: editingLeaf ? editingLeaf.id : `prod_${Date.now()}`,
      catalogueId: selectedCatalogueId,
      primaryCode: leafForm.primaryCode.trim(),
      name: leafForm.name.trim() || leafForm.primaryCode.trim(),
      type: leafForm.type.trim(),
      price: parseFloat(String(leafForm.price)) || 0,
      currency: leafForm.currency || '₹',
      summary: leafForm.summary,
      features: leafForm.features.split('\n').map((s) => s.trim()).filter(Boolean),
      specs: leafForm.specs,
      images:
        leafForm.images.length > 0
          ? leafForm.images
          : [generateBearingSvg({ d: 20, D: 47, B: 14 }, 1, 1)],
      sheetPage: editingLeaf?.sheetPage || 1,
      sortOrder: editingLeaf?.sortOrder || activeLeafs.length + 1,
    };

    try {
      // Clean up any images removed during editing
      if (editingLeaf && editingLeaf.images) {
        const currentImgs = new Set(newProduct.images);
        const removedImages = editingLeaf.images.filter((img) => !currentImgs.has(img));
        if (removedImages.length > 0) {
          await deleteStoredImages(removedImages);
        }
      }

      await saveProduct(newProduct);
      toast.success(`Leaf "${newProduct.primaryCode}" committed to collection`);
      onRefresh();
      setActiveLeafAction(null);
      setEditingLeaf(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Upload images directly to public directory
  const handleLeafImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    let count = 0;
    try {
      for (const f of Array.from(files)) {
        const res = await uploadImage(f);
        setLeafForm((prev) => ({
          ...prev,
          images: [...prev.images, res.url],
        }));
        count++;
      }
      toast.success(`Attached ${count} 3:4 image(s)`);
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // ==========================================
  // MULTI-SERIES GENERATOR WITH DRAG & DROP
  // ==========================================
  const handleOpenSeriesBuilder = () => {
    setActiveLeafAction('series-builder');
  };

  // Bulk series image dropper
  const handleSeriesImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const f of Array.from(files)) {
        const res = await uploadImage(f);
        uploadedUrls.push(res.url);
      }
      setSeriesImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`Uploaded ${uploadedUrls.length} series images. Arrange them below!`);
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Mouse drag & drop reordering of series images
  const handleDragStart = (idx: number) => {
    setDraggedImgIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedImgIdx === null || draggedImgIdx === targetIdx) {
      setDraggedImgIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...seriesImages];
    const [moved] = next.splice(draggedImgIdx, 1);
    next.splice(targetIdx, 0, moved);
    setSeriesImages(next);
    setDraggedImgIdx(null);
    setDragOverIdx(null);
    toast.info(`Moved image to Slot #${targetIdx + 1}`);
  };

  const removeSeriesImageAt = (idx: number) => {
    const removedUrl = seriesImages[idx];
    setSeriesImages((prev) => prev.filter((_, i) => i !== idx));
    if (removedUrl) {
      deleteStoredImages([removedUrl]);
    }
  };

  // Commit Generated Series to Database
  const handleCommitSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computedSeriesCodes.length === 0) {
      toast.error('No series codes generated. Check Start and End numbers.');
      return;
    }

    const variants: Variant[] = computedSeriesCodes.map((code, idx) => {
      const price = parseFloat(
        (seriesConfig.basePrice + idx * seriesConfig.priceIncrement).toFixed(2)
      );
      // Pair with arranged image in seriesImages at idx, or fallback to offline SVG
      const matchedImg =
        seriesImages[idx] ||
        generateBearingSvg({ d: 15 + idx * 2, D: 35 + idx * 4, B: 11 + idx }, 1, idx);

      return {
        code,
        name: `${code}`,
        price,
        specs: {
          'Serial Slot': `#${idx + 1}`,
          'Code': code,
          'Base Series': seriesConfig.title,
        },
        images: [matchedImg],
      };
    });

    const firstCode = computedSeriesCodes[0];
    const lastCode = computedSeriesCodes[computedSeriesCodes.length - 1];

    const seriesProduct: Product = {
      id: `prod_series_${Date.now()}`,
      catalogueId: selectedCatalogueId,
      isSeries: true,
      seriesCodeRange: `${firstCode} ~ ${lastCode}`,
      primaryCode: firstCode,
      name: seriesConfig.title,
      type: seriesConfig.type,
      price: variants[0]?.price || seriesConfig.basePrice,
      currency: activeCollection?.currency || '₹',
      summary: seriesConfig.summary,
      features: seriesConfig.features.split('\n').map((s) => s.trim()).filter(Boolean),
      specs: {
        'Series Codes': `${computedSeriesCodes.length} variants (${firstCode} to ${lastCode})`,
        'Category': seriesConfig.type,
        'Standard': 'Industrial Grade',
        ...seriesConfig.specs,
      },
      images: seriesImages.length > 0 ? seriesImages : variants.map((v) => v.images[0]),
      variants,
      sheetPage: 1,
      sortOrder: activeLeafs.length + 1,
    };

    try {
      await saveProduct(seriesProduct);
      toast.success(
        `Series "${seriesProduct.name}" created with ${variants.length} mapped variants!`
      );
      onRefresh();
      setActiveLeafAction(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Delete Leaf
  const triggerDeleteLeaf = (prod: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Leaf "${prod.primaryCode}"?`,
      message: `Are you sure you want to delete "${prod.name}" (${prod.primaryCode}) from this collection?`,
      action: async () => {
        try {
          // Clean public directory images for this product and its variants
          const imagesToDelete: string[] = [
            ...(prod.images || []),
            ...(prod.variants?.flatMap((v) => v.images || []) || []),
          ];
          if (imagesToDelete.length > 0) {
            await deleteStoredImages(imagesToDelete);
          }

          await deleteProduct(prod.id);
          toast.success(`Removed leaf ${prod.primaryCode}`);
          onRefresh();
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  // Reorder Leafs (A4 sheets order)
  const handleMoveLeaf = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= activeLeafs.length) return;

    const reordered = [...activeLeafs];
    const temp = reordered[index];
    reordered[index] = reordered[target];
    reordered[target] = temp;

    reordered.forEach((p, idx) => {
      p.sortOrder = idx + 1;
      p.sheetPage = Math.floor(idx / 2) + 1;
    });

    await bulkInsertProducts(reordered);
    toast.info('Updated leaf sorting order');
    onRefresh();
  };

  // ==========================================
  // VIEW: AUTHENTICATION LOCK IF NOT SIGNED IN
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-desk dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-line dark:border-zinc-800 p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center mb-3 shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink dark:text-zinc-100">
              Database Admin Studio
            </h1>
            <p className="text-xs text-muted dark:text-zinc-400 mt-1">
              Enter your credentials to manage collections & leafs
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 leading-relaxed">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink dark:text-zinc-200 block mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@yourcompany.com"
                className="w-full text-sm bg-desk/50 dark:bg-zinc-800 border border-line dark:border-zinc-700 rounded-xl px-4 py-2.5 text-ink dark:text-zinc-100 focus:border-ink dark:focus:border-zinc-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="mb-1">
                <label className="text-xs font-semibold text-ink dark:text-zinc-200">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm bg-desk/50 dark:bg-zinc-800 border border-line dark:border-zinc-700 rounded-xl px-4 py-2.5 text-ink dark:text-zinc-100 focus:border-ink dark:focus:border-zinc-500 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 bg-ink dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-sm py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isLoggingIn ? 'Connecting...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-line dark:border-zinc-800 text-center flex items-center justify-between">
            <button
              onClick={onExit}
              className="text-xs text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catalogue</span>
            </button>

            <button
              onClick={toggleDark}
              className="p-1.5 text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 rounded-lg"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UNIFIED DATABASE UI: COLLECTIONS & LEAFS
  // ==========================================
  return (
    <div className="min-h-screen bg-desk dark:bg-zinc-950 text-ink dark:text-zinc-100 flex flex-col font-sans transition-colors selection:bg-ink selection:text-white">
      {/* Top Bar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-line dark:border-zinc-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-1.5 text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 hover:bg-desk dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Catalogue View</span>
          </button>
          <div className="h-4 w-px bg-line dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-ink dark:text-zinc-100" />
            <h1 className="text-sm font-bold tracking-tight text-ink dark:text-zinc-100">
              Database Studio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDark}
            className="p-2 text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 hover:bg-desk dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Toggle Dark / Light Mode"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <span className="text-xs text-muted dark:text-zinc-400 font-mono hidden sm:inline-block">
            {currentUser.email}
          </span>

          <button
            onClick={handleLogout}
            className="p-2 text-muted dark:text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: Collections (Left) | Leafs (Right) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ==================================================== */}
        {/* LEFT PANE: COLLECTIONS (Categories)                  */}
        {/* ==================================================== */}
        <aside className="w-full md:w-72 bg-white dark:bg-zinc-900 border-r border-line dark:border-zinc-800 flex flex-col p-4 flex-shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-line dark:border-zinc-800 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted dark:text-zinc-400 uppercase tracking-wider font-mono">
              <Folder className="w-3.5 h-3.5" />
              <span>Collections ({catalogues.length})</span>
            </div>
            <button
              onClick={handleOpenAddCollection}
              className="p-1 text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 hover:bg-desk dark:hover:bg-zinc-800 rounded transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Add New Collection"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Inline Collection Add/Edit Box */}
          {isAddingCollection && (
            <form
              onSubmit={handleSaveCollection}
              className="p-3 mb-3 bg-desk/70 dark:bg-zinc-800/70 border border-line dark:border-zinc-700 rounded-xl space-y-2 animate-in fade-in duration-150"
            >
              <div className="flex justify-between items-center text-[11px] font-semibold text-ink dark:text-zinc-100">
                <span>{editingCollection ? 'Edit Collection' : 'New Collection'}</span>
                <button
                  type="button"
                  onClick={() => setIsAddingCollection(false)}
                  className="text-muted hover:text-ink dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Collection Title..."
                value={collectionForm.title}
                onChange={(e) => setCollectionForm({ ...collectionForm, title: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Brand (e.g. Decor Drapes Instyle)"
                value={collectionForm.brand}
                onChange={(e) => setCollectionForm({ ...collectionForm, brand: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingCollection(false)}
                  className="px-2 py-1 text-[11px] font-semibold text-muted hover:text-ink dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-[11px] font-semibold bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {/* Collections List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {catalogues.map((cat) => {
              const isSelected = selectedCatalogueId === cat.id;
              const leafCount = products.filter((p) => p.catalogueId === cat.id).length;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCatalogueId(cat.id);
                    setActiveLeafAction(null);
                  }}
                  className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs select-none ${
                    isSelected
                      ? 'bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 border-ink dark:border-zinc-100 shadow-sm'
                      : 'bg-transparent text-ink dark:text-zinc-200 border-transparent hover:bg-desk dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white dark:text-zinc-900' : 'text-muted dark:text-zinc-400'}`} />
                    <div className="truncate">
                      <div className="font-semibold truncate">{cat.title}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-white/70 dark:text-zinc-700' : 'text-muted dark:text-zinc-500'}`}>
                        {cat.brand}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 dark:bg-zinc-300 text-white dark:text-zinc-900'
                          : 'bg-desk dark:bg-zinc-800 text-muted dark:text-zinc-400'
                      }`}
                    >
                      {leafCount}
                    </span>

                    {/* Inline Actions */}
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditCollection(cat, e)}
                        className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/20 transition-colors ${
                          isSelected ? 'text-white dark:text-zinc-900' : 'text-muted hover:text-ink dark:hover:text-zinc-200'
                        }`}
                        title="Edit collection"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {catalogues.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => triggerDeleteCollection(cat, e)}
                          className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                          title="Delete collection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ==================================================== */}
        {/* RIGHT PANE: LEAFS (Products) IN ACTIVE COLLECTION    */}
        {/* ==================================================== */}
        <main className="flex-1 bg-desk/50 dark:bg-zinc-950 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Collection Header Bar */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-line dark:border-zinc-800 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase tracking-wider">
                    Collection / {activeCollection?.brand}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-ink dark:text-zinc-100">
                  {activeCollection?.title}
                </h2>
                <p className="text-xs text-muted dark:text-zinc-400 mt-0.5">
                  {activeLeafs.length} Leaf Records &bull; URL: <code className="font-mono text-ink dark:text-zinc-300">/c/{activeCollection?.slug}</code>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleOpenAddLeaf}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                    activeLeafAction === 'new-leaf'
                      ? 'bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md'
                      : 'bg-white dark:bg-zinc-800 text-ink dark:text-zinc-100 border border-line dark:border-zinc-700 hover:border-ink dark:hover:border-zinc-500'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Single</span>
                </button>

                <button
                  onClick={handleOpenSeriesBuilder}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                    activeLeafAction === 'series-builder'
                      ? 'bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md ring-2 ring-amber-400'
                      : 'bg-white dark:bg-zinc-800 text-ink dark:text-zinc-100 border border-line dark:border-zinc-700 hover:border-ink dark:hover:border-zinc-500'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Series Range</span>
                </button>
              </div>
            </div>

            {/* ==================================================== */}
            {/* INLINE ACTION 1: MULTI-SERIES RANGE GENERATOR        */}
            {/* ==================================================== */}
            {activeLeafAction === 'series-builder' && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-ink dark:border-zinc-700 p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-line dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-sm text-ink dark:text-zinc-100">
                      Multi-Series Generator & Mouse Drag-and-Drop Arranger
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveLeafAction(null)}
                    className="p-1 text-muted hover:text-ink dark:hover:text-zinc-200 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCommitSeries} className="space-y-5">
                  {/* Series Codes Input: Prefix, Start Number, End Number, Skip Numbers */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-desk/50 dark:bg-zinc-800/50 p-4 rounded-xl border border-line dark:border-zinc-700">
                    <div>
                      <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase block mb-1">
                        Code Prefix
                      </label>
                      <input
                        type="text"
                        value={seriesConfig.prefix}
                        onChange={(e) => setSeriesConfig({ ...seriesConfig, prefix: e.target.value })}
                        placeholder="e.g. BB-"
                        className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase block mb-1">
                        Starting Code #
                      </label>
                      <input
                        type="number"
                        required
                        value={seriesConfig.startNum}
                        onChange={(e) => setSeriesConfig({ ...seriesConfig, startNum: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase block mb-1">
                        Ending Code #
                      </label>
                      <input
                        type="number"
                        required
                        value={seriesConfig.endNum}
                        onChange={(e) => setSeriesConfig({ ...seriesConfig, endNum: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase block mb-1">
                        Codes to Skip
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 6203, 6207"
                        value={seriesConfig.skipCodes}
                        onChange={(e) => setSeriesConfig({ ...seriesConfig, skipCodes: e.target.value })}
                        className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Series Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-ink dark:text-zinc-200 block mb-1">
                        Series Title
                      </label>
                      <input
                        type="text"
                        required
                        value={seriesConfig.title}
                        onChange={(e) => setSeriesConfig({ ...seriesConfig, title: e.target.value })}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink dark:text-zinc-200 block mb-1">
                        Category / Type
                      </label>
                      <input
                        type="text"
                        required
                        value={seriesConfig.type}
                        onChange={(e) => setSeriesConfig({ ...seriesConfig, type: e.target.value })}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-ink dark:text-zinc-200 block mb-1">
                          Base Price (₹)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={seriesConfig.basePrice}
                          onChange={(e) => setSeriesConfig({ ...seriesConfig, basePrice: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs px-2.5 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink dark:text-zinc-200 block mb-1">
                          + Step (₹)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={seriesConfig.priceIncrement}
                          onChange={(e) => setSeriesConfig({ ...seriesConfig, priceIncrement: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs px-2.5 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Computed Pricing with +18% GST Addition */}
                  <div className="p-3 rounded-xl bg-desk/60 dark:bg-zinc-800/60 border border-line dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink dark:text-zinc-200">Rupee Pricing & GST:</span>
                      <span className="font-mono text-muted dark:text-zinc-400">
                        ₹{seriesConfig.basePrice} base + ₹{seriesConfig.priceIncrement} per step
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                      <span className="text-muted dark:text-zinc-400">
                        First ({computedSeriesCodes[0] || 'BB-1'}): <b className="text-ink dark:text-zinc-100">₹{seriesConfig.basePrice}</b> (+18% GST: ₹{(seriesConfig.basePrice * 1.18).toFixed(2)})
                      </span>
                      {computedSeriesCodes.length > 1 && (
                        <span className="text-muted dark:text-zinc-400">
                          Last ({computedSeriesCodes[computedSeriesCodes.length - 1]}): <b className="text-ink dark:text-zinc-100">₹{(seriesConfig.basePrice + (computedSeriesCodes.length - 1) * seriesConfig.priceIncrement).toFixed(2)}</b> (+18% GST: ₹{((seriesConfig.basePrice + (computedSeriesCodes.length - 1) * seriesConfig.priceIncrement) * 1.18).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Series Overview Summary & Highlights */}
                  <div className="space-y-3 p-4 bg-desk/30 dark:bg-zinc-800/30 rounded-xl border border-line dark:border-zinc-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-ink dark:text-zinc-200 block mb-1">
                          Series Overview Summary
                        </label>
                        <input
                          type="text"
                          value={seriesConfig.summary}
                          onChange={(e) => setSeriesConfig({ ...seriesConfig, summary: e.target.value })}
                          placeholder="Standard precision series engineered for motors, pumps and machinery."
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink dark:text-zinc-200 block mb-1">
                          Add Highlight Bullet / Chip
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSeriesFeature}
                            onChange={(e) => setNewSeriesFeature(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSeriesFeature();
                              }
                            }}
                            placeholder="e.g. Chrome steel 52100 (Press Enter)"
                            className="flex-1 text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                          <button
                            type="button"
                            onClick={addSeriesFeature}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-desk dark:bg-zinc-800 hover:bg-line dark:hover:bg-zinc-700 text-ink dark:text-zinc-100 border border-line dark:border-zinc-700 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Series Highlights Badges */}
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-line dark:border-zinc-700 min-h-[36px] items-center">
                      {seriesConfig.features.split('\n').map((s) => s.trim()).filter(Boolean).map((feat, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-desk dark:bg-zinc-800 border border-line dark:border-zinc-700 text-xs text-ink dark:text-zinc-100 shadow-sm"
                        >
                          <span>{feat}</span>
                          <button
                            type="button"
                            onClick={() => removeSeriesFeature(idx)}
                            className="text-muted hover:text-red-500 transition-colors"
                            title="Remove bullet highlight"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {seriesConfig.features.split('\n').filter(Boolean).length === 0 && (
                        <span className="text-xs text-muted dark:text-zinc-500 italic">
                          No highlights added yet.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Series Technical Specifications */}
                  <div className="space-y-2 p-4 bg-desk/30 dark:bg-zinc-800/30 rounded-xl border border-line dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-ink dark:text-zinc-200">
                        Technical Specifications (Key &bull; Value pairs)
                      </label>
                      <button
                        type="button"
                        onClick={addSeriesSpecRow}
                        className="text-xs font-semibold text-ink dark:text-zinc-200 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Specification</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {Object.entries(seriesConfig.specs || {}).map(([key, val], idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => handleSeriesSpecKeyChange(key, e.target.value)}
                            placeholder="Specification (e.g. Category)"
                            className="w-1/3 text-xs font-medium px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100"
                          />
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleSeriesSpecValChange(key, e.target.value)}
                            placeholder="Value (e.g. Deep groove ball bearing)"
                            className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100"
                          />
                          <button
                            type="button"
                            onClick={() => deleteSeriesSpecRow(key)}
                            className="p-1.5 text-muted hover:text-red-500 rounded-lg transition-colors"
                            title="Delete specification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {Object.keys(seriesConfig.specs || {}).length === 0 && (
                        <div className="text-center py-2 text-xs text-muted dark:text-zinc-500">
                          No technical specifications. Click &ldquo;Add Specification&rdquo; to add rows.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Computed Codes & Drag-and-Drop Image Slots */}
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="text-xs font-bold text-ink dark:text-zinc-100 flex items-center gap-2">
                          <span>Series Serial Order ({computedSeriesCodes.length} Codes)</span>
                          <span className="text-[10px] font-mono bg-desk dark:bg-zinc-800 text-muted dark:text-zinc-400 px-2 py-0.5 rounded-full">
                            {seriesImages.length} of {computedSeriesCodes.length} images assigned
                          </span>
                        </div>
                        <p className="text-[11px] text-muted dark:text-zinc-400">
                          Drag and drop any image card with your mouse to rearrange in the exact order of the series codes.
                        </p>
                      </div>

                      {/* Bulk upload trigger */}
                      <label className="cursor-pointer bg-ink dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Saving...' : 'Drop Series Images'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={isUploading}
                          onChange={handleSeriesImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Drag and Drop Grid Slots */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 p-4 bg-desk/40 dark:bg-zinc-800/40 rounded-xl border border-line dark:border-zinc-700">
                      {computedSeriesCodes.map((code, idx) => {
                        const img = seriesImages[idx];
                        const isDragging = draggedImgIdx === idx;
                        const isOver = dragOverIdx === idx;

                        return (
                          <div
                            key={code}
                            draggable={Boolean(img)}
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={() => handleDrop(idx)}
                            className={`rounded-xl border p-2 flex flex-col justify-between transition-all select-none relative group ${
                              isOver
                                ? 'border-amber-500 scale-105 bg-amber-500/10'
                                : isDragging
                                ? 'opacity-40 border-dashed border-ink dark:border-zinc-400'
                                : 'bg-white dark:bg-zinc-900 border-line dark:border-zinc-700'
                            }`}
                          >
                            {/* Slot Header */}
                            <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1.5 pb-1 border-b border-line dark:border-zinc-800">
                              <span className="text-ink dark:text-zinc-100 truncate">{code}</span>
                              <span className="text-muted dark:text-zinc-500 text-[9px]">#{idx + 1}</span>
                            </div>

                            {/* 3:4 Aspect Image Card */}
                            <div className="aspect-[3/4] rounded-lg bg-desk dark:bg-zinc-800 border border-line dark:border-zinc-700 overflow-hidden relative flex items-center justify-center">
                              {img ? (
                                <>
                                  <img
                                    src={img}
                                    alt={`Code ${code}`}
                                    className="w-full h-full object-contain pointer-events-none"
                                  />
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => removeSeriesImageAt(idx)}
                                      className="p-1 bg-red-600 text-white rounded-full shadow-sm hover:scale-110 transition-transform"
                                      title="Remove from slot"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-mono px-1 rounded flex items-center gap-0.5">
                                    <GripVertical className="w-2.5 h-2.5" />
                                    <span>Drag</span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-[10px] text-muted dark:text-zinc-500 text-center p-2">
                                  Empty Slot
                                </div>
                              )}
                            </div>

                            {/* Slot Footer with Slot Price & GST */}
                            <div className="mt-1.5 pt-1 border-t border-line/60 dark:border-zinc-800 text-[10px] font-mono flex items-center justify-between">
                              <span className="font-semibold text-ink dark:text-zinc-200">
                                ₹{(seriesConfig.basePrice + idx * seriesConfig.priceIncrement).toFixed(0)}
                              </span>
                              <span className="text-muted dark:text-zinc-500 text-[9px]">
                                +18%: ₹{((seriesConfig.basePrice + idx * seriesConfig.priceIncrement) * 1.18).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2.5 pt-3 border-t border-line dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setActiveLeafAction(null)}
                      className="px-4 py-2 text-xs font-semibold text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 bg-desk dark:bg-zinc-800 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-ink dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold px-6 py-2 rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Commit {computedSeriesCodes.length} Series Leaf to Database</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ==================================================== */}
            {/* INLINE ACTION 2: SINGLE LEAF CREATOR / EDITOR        */}
            {/* ==================================================== */}
            {(activeLeafAction === 'new-leaf' || activeLeafAction === 'edit-leaf') && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-ink dark:border-zinc-700 p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-line dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-ink dark:text-zinc-100">
                    {editingLeaf ? `Edit Leaf: ${editingLeaf.primaryCode}` : 'Create Single Leaf'}
                  </h3>
                  <button
                    onClick={() => setActiveLeafAction(null)}
                    className="p-1 text-muted hover:text-ink dark:hover:text-zinc-200 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveLeaf} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase block mb-1">
                        Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={leafForm.primaryCode}
                        onChange={(e) => setLeafForm({ ...leafForm, primaryCode: e.target.value })}
                        placeholder="e.g. BB-6204"
                        className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase block mb-1">
                        Product Title
                      </label>
                      <input
                        type="text"
                        required
                        value={leafForm.name}
                        onChange={(e) => setLeafForm({ ...leafForm, name: e.target.value })}
                        placeholder="e.g. Deep Groove Ball Bearing"
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase">
                          Price (₹)
                        </label>
                        <span className="text-[10px] font-mono text-muted dark:text-zinc-400">
                          +18%: ₹{(leafForm.price * 1.18).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        value={leafForm.price}
                        onChange={(e) => setLeafForm({ ...leafForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase block mb-1">
                        Type / Subcategory
                      </label>
                      <input
                        type="text"
                        value={leafForm.type}
                        onChange={(e) => setLeafForm({ ...leafForm, type: e.target.value })}
                        placeholder="e.g. Single Row Deep Groove"
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase block mb-1">
                        Summary
                      </label>
                      <input
                        type="text"
                        value={leafForm.summary}
                        onChange={(e) => setLeafForm({ ...leafForm, summary: e.target.value })}
                        placeholder="Standard precision series engineered for motors, pumps and machinery."
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      />
                    </div>
                  </div>

                  {/* Product Overview Highlights (Chips / Bullets) */}
                  <div className="space-y-2 p-3.5 bg-desk/40 dark:bg-zinc-800/40 rounded-xl border border-line dark:border-zinc-700">
                    <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase block font-semibold">
                      Product Overview Highlights (Bullet Chips)
                    </label>
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                      {leafForm.features.split('\n').map((s) => s.trim()).filter(Boolean).map((feat, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 text-xs text-ink dark:text-zinc-100 shadow-sm"
                        >
                          <span>{feat}</span>
                          <button
                            type="button"
                            onClick={() => removeLeafFeature(idx)}
                            className="text-muted hover:text-red-500 transition-colors"
                            title="Remove bullet highlight"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {leafForm.features.split('\n').filter(Boolean).length === 0 && (
                        <span className="text-xs text-muted dark:text-zinc-500 italic">
                          No highlights added yet. Add feature bullet points below.
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newLeafFeature}
                        onChange={(e) => setNewLeafFeature(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addLeafFeature();
                          }
                        }}
                        placeholder="e.g. Chrome steel 52100 (Type and press Enter)"
                        className="flex-1 text-xs px-3 py-1.5 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={addLeafFeature}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-desk dark:bg-zinc-800 hover:bg-line dark:hover:bg-zinc-700 text-ink dark:text-zinc-100 border border-line dark:border-zinc-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Technical Specifications (Key & Value pairs) */}
                  <div className="space-y-2 p-3.5 bg-desk/40 dark:bg-zinc-800/40 rounded-xl border border-line dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono text-muted dark:text-zinc-400 uppercase font-semibold">
                        Technical Specifications (Key &bull; Value pairs)
                      </label>
                      <button
                        type="button"
                        onClick={addLeafSpecRow}
                        className="text-xs font-semibold text-ink dark:text-zinc-200 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Specification</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {Object.entries(leafForm.specs || {}).map(([key, val], idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => handleLeafSpecKeyChange(key, e.target.value)}
                            placeholder="Specification (e.g. Category)"
                            className="w-1/3 text-xs font-medium px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100"
                          />
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleLeafSpecValChange(key, e.target.value)}
                            placeholder="Value (e.g. Deep groove ball bearing)"
                            className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 rounded-lg text-ink dark:text-zinc-100"
                          />
                          <button
                            type="button"
                            onClick={() => deleteLeafSpecRow(key)}
                            className="p-1.5 text-muted hover:text-red-500 rounded-lg transition-colors"
                            title="Delete specification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {Object.keys(leafForm.specs || {}).length === 0 && (
                        <div className="text-center py-2 text-xs text-muted dark:text-zinc-500">
                          No technical specifications. Click &ldquo;Add Specification&rdquo; to add rows.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Images & Slat Showcase Views */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-ink dark:text-zinc-200">
                        Product Images & Showcase Views
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-desk dark:bg-zinc-800 hover:bg-line/50 text-ink dark:text-zinc-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-line dark:border-zinc-700 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleLeafImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-desk/30 dark:bg-zinc-800/30 rounded-xl border border-line dark:border-zinc-700">
                      {leafForm.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="aspect-[3/4] rounded-lg bg-white dark:bg-zinc-900 border border-line dark:border-zinc-700 overflow-hidden relative group"
                        >
                          <img src={img} alt="" className="w-full h-full object-contain" />
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                const removedUrl = leafForm.images[idx];
                                setLeafForm({
                                  ...leafForm,
                                  images: leafForm.images.filter((_, i) => i !== idx),
                                });
                                if (removedUrl) {
                                  deleteStoredImages([removedUrl]);
                                }
                              }}
                              className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-line dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setActiveLeafAction(null)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-ink dark:hover:text-zinc-200 bg-desk dark:bg-zinc-800 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Commit Leaf</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ==================================================== */}
            {/* LEAFS DATABASE TABLE / RECORDS LIST                  */}
            {/* ==================================================== */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-line dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
              {/* Search Bar & Quick Filter */}
              <div className="p-3.5 border-b border-line dark:border-zinc-800 flex items-center justify-between gap-3 bg-desk/30 dark:bg-zinc-800/30">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-muted dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search leafs by code or name..."
                    className="w-full text-xs bg-white dark:bg-zinc-800 border border-line dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-ink dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="text-[11px] font-mono text-muted dark:text-zinc-400">
                  Showing {filteredLeafs.length} of {activeLeafs.length} leafs
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-desk/40 dark:bg-zinc-800/40 border-b border-line dark:border-zinc-800 font-mono text-muted dark:text-zinc-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 w-12">Order</th>
                      <th className="py-2.5 px-4 w-16">3:4 Image</th>
                      <th className="py-2.5 px-4">Code / Range</th>
                      <th className="py-2.5 px-4">Leaf Name</th>
                      <th className="py-2.5 px-4">Price</th>
                      <th className="py-2.5 px-4">Variants</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line dark:divide-zinc-800 font-normal">
                    {filteredLeafs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted dark:text-zinc-500 text-xs">
                          No leafs in this collection. Click "Single" or "+ Series Range" above to create!
                        </td>
                      </tr>
                    ) : (
                      filteredLeafs.map((prod, idx) => (
                        <tr
                          key={prod.id}
                          className="hover:bg-desk/30 dark:hover:bg-zinc-800/40 transition-colors group"
                        >
                          {/* Order / Sheet Pairing Control */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleMoveLeaf(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 hover:bg-desk dark:hover:bg-zinc-700 rounded disabled:opacity-20"
                                title="Move up"
                              >
                                <MoveUp className="w-3 h-3 text-muted dark:text-zinc-400" />
                              </button>
                              <button
                                onClick={() => handleMoveLeaf(idx, 'down')}
                                disabled={idx === filteredLeafs.length - 1}
                                className="p-1 hover:bg-desk dark:hover:bg-zinc-700 rounded disabled:opacity-20"
                                title="Move down"
                              >
                                <MoveDown className="w-3 h-3 text-muted dark:text-zinc-400" />
                              </button>
                            </div>
                          </td>

                          {/* 3:4 Image Thumbnail */}
                          <td className="py-2.5 px-4">
                            <div className="w-9 aspect-[3/4] rounded bg-desk dark:bg-zinc-800 border border-line dark:border-zinc-700 overflow-hidden flex items-center justify-center">
                              <img
                                src={prod.images[0]}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </td>

                          {/* Code */}
                          <td className="py-2.5 px-4 font-mono font-bold text-ink dark:text-zinc-100">
                            {prod.primaryCode}
                          </td>

                          {/* Name & Type */}
                          <td className="py-2.5 px-4 font-medium text-ink dark:text-zinc-200 max-w-xs truncate">
                            <div>{prod.name}</div>
                            <div className="text-[10px] text-muted dark:text-zinc-400 font-normal">{prod.type}</div>
                          </td>

                          {/* Price */}
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-ink dark:text-zinc-100 font-mono">
                              {prod.currency || '₹'}{prod.price.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-muted dark:text-zinc-400 font-mono">
                              +18% GST ({prod.currency || '₹'}{(prod.price * 1.18).toFixed(2)})
                            </div>
                          </td>

                          {/* Series Range / Variants */}
                          <td className="py-2.5 px-4">
                            {prod.isSeries ? (
                              <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                                {prod.seriesCodeRange} ({prod.variants?.length || 0})
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted dark:text-zinc-500 font-mono">
                                1 Single
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditLeaf(prod)}
                                className="p-1.5 hover:bg-desk dark:hover:bg-zinc-800 text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 rounded-lg transition-colors"
                                title="Edit Leaf"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => triggerDeleteLeaf(prod)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-muted dark:text-zinc-400 hover:text-red-600 rounded-lg transition-colors"
                                title="Delete Leaf"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Custom Confirmation Popover */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={true}
        confirmLabel="Delete"
        onConfirm={async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await confirmDialog.action();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
