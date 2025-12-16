import React, { useEffect, useState } from 'react';
import { ref, onValue, runTransaction, set, get } from 'firebase/database';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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

const DEFAULT_IMG = 'https://via.placeholder.com/600x400?text=No+Image';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'category'>('newest');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRating | null>(null);

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

  // Open product details modal
  const openProductDetails = (product: ProductWithRating) => {
    setSelectedProduct(product);
    // Reset rating inputs inside modal
    setRatingValue(0);
    setRatingMessage('');
    setRatingError(null);
  };

  // Submit rating function (inside modal)
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
      // Check if user already rated
      const snap = await get(userRatingRef);
      if (snap.exists()) {
        setRatingError('You have already rated this product.');
        setRatingSubmitting(false);
        return;
      }

      // Save user rating
      await set(userRatingRef, {
        rating: ratingValue,
        message: ratingMessage.trim(),
        userId,
        timestamp: Date.now(),
      });

      // Update aggregate safely
      await runTransaction(productRef, (current) => {
        if (!current) return current;
        const prevSum = typeof current.ratingSum === 'number' ? current.ratingSum : 0;
        const prevCount = typeof current.ratingCount === 'number' ? current.ratingCount : 0;
        current.ratingSum = prevSum + ratingValue;
        current.ratingCount = prevCount + 1;
        return current;
      });

      // Refresh product details from DB
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

      // Reset rating inputs after successful submit
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 max-w-7xl mx-auto">
      {/* Header */}
      {/* Header */}
<header className="mb-6">
  <div className="flex flex-col gap-4">
    <h1 className="text-3xl font-bold text-gray-900">Product Catalogue</h1>
    
    <div className="flex flex-col xs:flex-row gap-3">
      <input
        type="text"
        placeholder="Search products..."
        className="w-full xs:flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <select
        className="w-full xs:w-auto px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
      >
        <option value="newest">Newest First</option>
        <option value="name">Name A–Z</option>
        <option value="category">Category</option>
      </select>
    </div>
  </div>
</header>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <p className="text-center text-gray-600 text-xl mt-20">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md p-4 flex flex-col cursor-pointer hover:shadow-xl transition"
              onClick={() => openProductDetails(product)}
              aria-label={`Open details for ${product.name}`}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if(e.key === 'Enter') openProductDetails(product); }}
            >
              <div className="h-40 w-full rounded-md overflow-hidden bg-gray-100 mb-3">
                <img
                  src={product.imageUrl || (product.images && product.images[0]) || DEFAULT_IMG}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-gray-500 text-sm mt-1 mb-0.5

                line-clamp-1 sm:line-clamp-4">
                {product.description}
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-between pt-3 border-t gap-2">
                <div className="flex items-center gap-1 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xl ${
                        star <= Math.round(product.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'
                      } select-none`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm text-gray-600 select-none">({product.ratingCount || 0})</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openProductDetails(product);
                  }}
                  className="text-blue-600 hover:underline text-sm font-semibold cursor-pointer flex-shrink-0"
                  aria-label={`Rate ${product.name}`}
                >
                  Rate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 overflow-auto"
          onClick={() => setSelectedProduct(null)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              aria-label="Close details"
            >
              <X size={28} />
            </button>

            {/* Media Carousel */}
            <div className="flex gap-4 overflow-x-auto mb-6 py-2 no-scrollbar">
              {(selectedProduct.images && selectedProduct.images.length > 0
                ? selectedProduct.images
                : selectedProduct.imageUrl ? [selectedProduct.imageUrl] : [DEFAULT_IMG]
              ).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${selectedProduct.name} image ${idx + 1}`}
                  className="w-48 h-48 object-cover rounded-lg flex-shrink-0 shadow-md"
                />
              ))}

              {selectedProduct.video && (
                <video
                  controls
                  className="w-48 h-48 rounded-lg flex-shrink-0 shadow-md"
                  aria-label={`${selectedProduct.name} video`}
                >
                  <source src={selectedProduct.video} type="video/mp4" />
                  Sorry, your browser doesn't support embedded videos.
                </video>
              )}
            </div>

            {/* Product Info */}
            <h2 id="modal-title" className="text-3xl font-bold mb-2">{selectedProduct.name}</h2>
            <p id="modal-description" className="text-gray-700 whitespace-pre-line mb-6">{selectedProduct.description}</p>

            {/* Aggregate Ratings Display */}
            <section className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Overall Rating</h3>
              <div className="flex items-center gap-3">
                <div className="text-yellow-400 text-4xl font-bold select-none">
                  {(selectedProduct.averageRating || 0).toFixed(1)}
                </div>
                <div>
                  <div className="flex gap-1 text-yellow-400 text-xl select-none">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={star <= Math.round(selectedProduct.averageRating || 0) ? '' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {selectedProduct.ratingCount || 0} rating{(selectedProduct.ratingCount || 0) !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </section>

            {/* Fix #3: Rate Yourself section inside modal */}
            <section className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Rate Yourself</h3>
              {selectedProduct.ratings && Object.keys(selectedProduct.ratings).includes(getUserId()) ? (
                <p className="text-green-600 mb-4">You have already rated this product.</p>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`text-5xl focus:outline-none ${
                          star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        onClick={() => setRatingValue(star)}
                        aria-label={`${star} star`}
                        style={{ cursor: 'pointer' }}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="w-full border border-gray-300 rounded p-3 resize-none mb-4"
                    placeholder="Leave a comment (optional)"
                    rows={4}
                    value={ratingMessage}
                    onChange={(e) => setRatingMessage(e.target.value)}
                    aria-label="Rating comment"
                  />

                  {ratingError && <p className="text-red-600 mb-3">{ratingError}</p>}

                  <button
                    onClick={submitRating}
                    disabled={ratingSubmitting}
                    className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-blue-300"
                    style={{ cursor: ratingSubmitting ? 'not-allowed' : 'pointer' }}
                    aria-disabled={ratingSubmitting}
                  >
                    {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </>
              )}
            </section>

            {/* Show all user ratings */}
            <section className="mt-8 border-t pt-6 max-h-64 overflow-y-auto no-scrollbar">
              <h3 className="text-xl font-semibold mb-4">User Ratings</h3>
              {selectedProduct.ratings && Object.keys(selectedProduct.ratings).length > 0 ? (
                Object.values(selectedProduct.ratings)
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((r, i) => (
                    <div key={i} className="mb-4 border-b pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* User icon/avatar placeholder */}
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm uppercase select-none">
                          {(r.userId ?? '').startsWith('anon-') ? 'A' : 'U'}
                        </div>
                        <div className="flex gap-1 text-yellow-400 select-none">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= r.rating ? '' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                      </div>
                      {r.message && <p className="text-gray-700">{r.message}</p>}
                    </div>
                  ))
              ) : (
                <p className="text-gray-500">No ratings yet.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogueWithPopupRating;
