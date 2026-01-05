import React, { useEffect, useState } from 'react';
import { ref, onValue, runTransaction, set, get } from '../config/firebase';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from '../config/firebase';
import { database } from '../config/firebase';
import { X } from 'lucide-react';

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

const CatalogueWithPopupRating: React.FC = () => {
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

  // Filter & sort products
  const filteredProducts = products
    .filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'newest':
        default:
          const atA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const atB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return atB - atA;
      }
    });

  const openProductDetails = (product: ProductWithRating) => {
    setSelectedProduct(product);
    const initialImage = product.imageUrl || (product.images && product.images[0]) || DEFAULT_IMG;
    setFocusedImage(initialImage);
    setRatingValue(0);
    setRatingMessage('');
    setRatingError(null);
  };

  const submitRating = async () => {
    if (!selectedProduct) return;
    if (ratingValue < 1 || ratingValue > 5) {
      setRatingError('Please select 1 to 5 stars.');
      return;
    }

    setRatingSubmitting(true);
    setRatingError(null);

    const userId = getUserId();
    const productId = selectedProduct.id;
    const productRef = ref(database, `products/${productId}`);
    const userRatingRef = ref(database, `products/${productId}/ratings/${userId}`);

    try {
      const snap = await get(userRatingRef);
      if (snap.exists()) {
        setRatingError('You have already rated this product.');
        setRatingSubmitting(false);
        return;
      }

      await set(userRatingRef, {
        rating: ratingValue,
        message: ratingMessage.trim(),
        userId,
        timestamp: Date.now(),
      });

      await runTransaction(productRef, (current) => {
        if (!current) return current;
        current.ratingSum = (current.ratingSum || 0) + ratingValue;
        current.ratingCount = (current.ratingCount || 0) + 1;
        return current;
      });

      const prodSnap = await get(productRef);
      if (prodSnap.exists()) {
        const p = prodSnap.val();
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-indigo-600 dark:border-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-6 px-4 max-w-7xl mx-auto transition-colors">
      <header className="mb-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Product Catalogue</h1>
        </div>
      </header>

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
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-semibold cursor-pointer flex-shrink-0"
                  aria-label={`Rate ${product.name}`}
                >
                  Rate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-end sm:items-center sm:justify-center sm:p-4 overflow-hidden backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto border-t border-neutral-200 dark:border-neutral-800 sm:border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2">
                <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full"></div>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-neutral-100/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 transition-colors z-10"
              aria-label="Close details"
            >
              <X size={20} />
            </button>

            {/* Image Gallery */}
            <div className="mb-6">
              <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-4">
                <img
                  src={focusedImage || DEFAULT_IMG}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
                {(selectedProduct.images && selectedProduct.images.length > 0
                  ? selectedProduct.images
                  : selectedProduct.imageUrl ? [selectedProduct.imageUrl] : []
                ).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFocusedImage(img)}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 focus:outline-none border-2 transition-all ${
                      focusedImage === img
                        ? 'border-indigo-500'
                        : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {selectedProduct.video && (
                <div className="mt-4">
                    <video
                    controls
                    className="w-full rounded-lg shadow-md"
                    aria-label={`${selectedProduct.name} video`}
                    >
                    <source src={selectedProduct.video} type="video/mp4" />
                    Your browser does not support the video tag.
                    </video>
                </div>
              )}
            </div>

            <h2 id="modal-title" className="text-3xl font-bold mb-2 text-neutral-900 dark:text-white">{selectedProduct.name}</h2>
            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line mb-6">{selectedProduct.description}</p>

            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Overall Rating</h3>
              <div className="flex items-center gap-3">
                <div className="text-yellow-400 text-4xl font-bold select-none">
                  {(selectedProduct.averageRating || 0).toFixed(1)}
                </div>
                <div>
                  <div className="flex gap-1 text-yellow-400 text-xl select-none">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={star <= Math.round(selectedProduct.averageRating || 0) ? '' : 'text-neutral-300 dark:text-neutral-600'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                    {selectedProduct.ratingCount || 0} rating{(selectedProduct.ratingCount || 0) !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </section>

            <section className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Your Rating</h3>
              {selectedProduct.ratings && Object.keys(selectedProduct.ratings).includes(getUserId()) ? (
                <p className="text-green-600 dark:text-green-400 font-semibold mb-4">Thanks for your rating!</p>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`text-5xl focus:outline-none transition-colors ${
                          star <= ratingValue ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600 hover:text-yellow-300'
                        }`}
                        onClick={() => setRatingValue(star)}
                        aria-label={`${star} star`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 rounded p-3 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Leave a comment (optional)"
                    rows={4}
                    value={ratingMessage}
                    onChange={(e) => setRatingMessage(e.target.value)}
                    aria-label="Rating comment"
                  />

                  {ratingError && <p className="text-red-600 dark:text-red-400 mb-3">{ratingError}</p>}

                  <div className="flex justify-center">
                    <button
                      onClick={submitRating}
                      disabled={ratingSubmitting}
                      className="bg-indigo-600 text-white py-3 px-8 rounded-full hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 transition-colors"
                      aria-disabled={ratingSubmitting}
                    >
                      {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-6 max-h-64 overflow-y-auto no-scrollbar">
              <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">User Reviews</h3>
              {selectedProduct.ratings && Object.keys(selectedProduct.ratings).length > 0 ? (
                Object.values(selectedProduct.ratings)
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((r, i) => (
                    <div key={i} className="mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
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
                <p className="text-neutral-500 dark:text-neutral-400">No reviews yet.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogueWithPopupRating;