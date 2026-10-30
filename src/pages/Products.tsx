import React, { useEffect, useState } from 'react';
import Spinner from '../components/common/Spinner';
import { Link } from 'react-router-dom';
import { ref, onValue, runTransaction, set, get } from '../config/firebase';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from '../config/firebase';
import { database } from '../config/firebase';
import { X, BookOpen, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  video?: string;
  category?: string;
  createdAt?: string;
}

interface RatingData {
  rating: number;
  message?: string;
  userId: string;
  timestamp: number;
}

interface ProductWithRating extends Product {
  ratingSum?: number;
  ratingCount?: number;
  averageRating?: number;
  ratings?: { [userId: string]: RatingData };
}

const DEFAULT_IMG = 'https://picsum.photos/200/300';

function getUserId(): string {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) return user.uid;

  let anonId = localStorage.getItem('anonUserId');
  if (!anonId) {
    anonId = 'anon-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('anonUserId', anonId);
  }
  return anonId;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, _setSearchQuery] = useState('');
  const [sortBy, _setSortBy] = useState<'newest' | 'name' | 'category'>('newest');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRating | null>(null);
  const [focusedImage, setFocusedImage] = useState<string | null>(null);

  // Rating inside modal state
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingMessage, setRatingMessage] = useState('');
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const [_currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Auth listener
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (user) => setCurrentUser(user));
  }, []);

  // Load products from DB
  useEffect(() => {
    const productsRef = ref(database, 'products');
    const unsub = onValue(productsRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const list: ProductWithRating[] = Object.entries(val).map(([key, p]) => {
        const prod = p as any;
        const ratingSum = typeof prod.ratingSum === 'number' ? prod.ratingSum : 0;
        const ratingCount = typeof prod.ratingCount === 'number' ? prod.ratingCount : 0;
        const averageRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
        const ratings = prod.ratings || {};

        return {
          id: key,
          ...prod,
          ratingSum,
          ratingCount,
          averageRating,
          ratings,
        };
      });

      setProducts(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Sort & filter products
  const filteredProducts = products
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
      // default: newest
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

  // Modal open & close
  const openProductDetails = (product: ProductWithRating) => {
    setSelectedProduct(product);
    setFocusedImage(product.imageUrl || (product.images && product.images[0]) || DEFAULT_IMG);
    setRatingValue(0);
    setRatingMessage('');
    setRatingError(null);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setFocusedImage(null);
    setRatingValue(0);
    setRatingMessage('');
    setRatingError(null);
  };

  // Submit Rating
  const submitRating = async () => {
    if (!selectedProduct) return;
    if (ratingValue < 1 || ratingValue > 5) {
      setRatingError('Please select a star rating (1-5).');
      return;
    }
    setRatingSubmitting(true);
    setRatingError(null);

    const userId = getUserId();
    const productId = selectedProduct.id;
    const productRef = ref(database, `products/${productId}`);
    const userRatingRef = ref(database, `products/${productId}/ratings/${userId}`);

    try {
      // Check existing user rating
      const existingSnap = await get(userRatingRef);
      const prevRating = existingSnap.exists() ? (existingSnap.val().rating as number) : null;

      // Update rating in a transaction
      await runTransaction(productRef, (currentData) => {
        if (!currentData) return currentData;

        let ratingSum = currentData.ratingSum || 0;
        let ratingCount = currentData.ratingCount || 0;

        if (prevRating !== null) {
          ratingSum = ratingSum - prevRating + ratingValue;
        } else {
          ratingSum += ratingValue;
          ratingCount += 1;
        }

        return {
          ...currentData,
          ratingSum,
          ratingCount,
        };
      });

      // Save user rating data
      const ratingData: RatingData = {
        rating: ratingValue,
        message: ratingMessage.trim(),
        userId,
        timestamp: Date.now(),
      };
      await set(userRatingRef, ratingData);

      // Update local state for immediate feedback
      const updatedSnap = await get(productRef);
      if (updatedSnap.exists()) {
        const p = updatedSnap.val();
        setSelectedProduct({
          ...selectedProduct,
          ratingSum: p.ratingSum,
          ratingCount: p.ratingCount,
          averageRating: p.ratingCount > 0 ? p.ratingSum / p.ratingCount : 0,
          ratings: p.ratings || {},
        });
      }

      setRatingValue(0);
      setRatingMessage('');
      setRatingError(null);
    } catch (err) {
      setRatingError('Error submitting rating. Try again later.');
      console.error(err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen text="Loading products..." />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-6 px-4 max-w-7xl mx-auto transition-colors">
      <header className="mb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Our Products</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Browse our full catalog of premium blinds, drapery, and fabrics.
          </p>
        </div>
      </header>

      {/* Virtual Catalogue Banner CTA */}
      <section className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 text-white p-6 sm:p-8 shadow-xl border border-neutral-700/60">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide text-neutral-200 border border-white/15">
              <span>UPCOMING</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Our Virtual Digital Catalogue
            </h2>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Experience our curated blinds and drapery collections in interactive A4 presentation sheets. View high-resolution swatches, exact technical specifications, series code ranges, and download instant PDFs.
            </p>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-neutral-300 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Virtual A4 Sheets
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                High-Res Swatches
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                One-Click PDF Export
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-shrink-0">
            <Link
              to="/catalogue"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white text-neutral-900 font-bold hover:bg-neutral-100 hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-sm group"
            >
              <BookOpen className="w-4 h-4 text-neutral-900" />
              <span>Virtual Catalogue</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {filteredProducts.length === 0 ? (
        <p className="text-center text-neutral-600 dark:text-neutral-400 text-xl mt-20">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-2 md:p-4 flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
              onClick={() => openProductDetails(product)}
              aria-label={`Open details for ${product.name}`}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if(e.key === 'Enter') openProductDetails(product); }}
            >
              <div className="h-40 w-full rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-3">
                <img
                  src={product.imageUrl || (product.images && product.images[0]) || DEFAULT_IMG}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">{product.name}</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 mb-2 line-clamp-3">
                {product.description}
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 gap-2">
                <div className="flex items-center gap-1 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xl ${
                        star <= Math.round(product.averageRating || 0) ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600'
                      } select-none`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400 select-none">({product.ratingCount || 0})</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openProductDetails(product);
                  }}
                  className="text-xs px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                >
                  Rate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal View */}
      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={closeProductDetails}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeProductDetails}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>

            {/* Product Title */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{selectedProduct.name}</h2>
              {selectedProduct.category && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {selectedProduct.category}
                </span>
              )}
            </div>

            {/* Main Image */}
            <div className="w-full h-72 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <img
                src={focusedImage || DEFAULT_IMG}
                alt={selectedProduct.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Gallery Thumbnails */}
            {selectedProduct.images && selectedProduct.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedProduct.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFocusedImage(img)}
                    className={`h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                      focusedImage === img ? 'border-indigo-600 dark:border-indigo-400' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            {selectedProduct.description && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
                  {selectedProduct.description}
                </p>
              </div>
            )}

            {/* Video */}
            {selectedProduct.video && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">
                  Product Video
                </h4>
                <div className="aspect-video w-full rounded-xl overflow-hidden">
                  <iframe
                    src={selectedProduct.video}
                    title="Product video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Rating Section */}
            <section className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Customer Reviews</h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl text-yellow-400">★</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {(selectedProduct.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    ({selectedProduct.ratingCount || 0})
                  </span>
                </div>
              </div>

              {/* Submit Rating Form */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-3">
                <h5 className="font-semibold text-sm text-neutral-900 dark:text-white">Leave a Review</h5>
                <div className="flex gap-1 text-2xl cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className={`transition ${
                        star <= ratingValue ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="Share your experience (optional)..."
                  value={ratingMessage}
                  onChange={(e) => setRatingMessage(e.target.value)}
                  className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2.5 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {ratingError && <p className="text-xs text-red-500">{ratingError}</p>}
                <button
                  onClick={submitRating}
                  disabled={ratingSubmitting}
                  className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                >
                  {ratingSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>

              {/* Reviews List */}
              {selectedProduct.ratings && Object.keys(selectedProduct.ratings).length > 0 ? (
                Object.values(selectedProduct.ratings)
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((r, idx) => (
                    <div
                      key={idx}
                      className="border-b border-neutral-100 dark:border-neutral-800 pb-3 last:border-none space-y-1 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm uppercase select-none">
                          {(r.userId ?? '').startsWith('anon-') ? 'A' : 'U'}
                        </div>
                        <div className="flex gap-1 text-yellow-400 select-none">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= r.rating ? '' : 'text-neutral-300 dark:text-neutral-600'}>★</span>
                          ))}
                        </div>
                      </div>
                      {r.message && <p className="text-neutral-700 dark:text-neutral-300">{r.message}</p>}
                    </div>
                  ))
              ) : (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">No reviews yet.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

