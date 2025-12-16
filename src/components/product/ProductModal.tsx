import React, { useState } from "react";
import { X, Star, ChevronLeft, ChevronRight } from "lucide-react";

interface RatingData {
  rating: number;
  message?: string;
  userId: string;
  timestamp: number;
}

interface ProductWithRating {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  video?: string;
  category?: string;
  createdAt?: string;
  ratingSum?: number;
  ratingCount?: number;
  averageRating?: number;
  ratings?: { [userId: string]: RatingData };
}

interface ProductDetailsModalProps {
  product: ProductWithRating;
  onClose: () => void;
  onSubmitRating?: (rating: number, message: string) => Promise<void>;
}

const DEFAULT_IMG = 'https://via.placeholder.com/800x600?text=No+Image';

function getUserId(): string {
  const auth = (window as any).firebase?.auth?.();
  const user = auth?.currentUser;
  if (user) return user.uid;
  let anonId = localStorage.getItem('anonUserId');
  if (!anonId) {
    anonId = 'anon-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('anonUserId', anonId);
  }
  return anonId;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onSubmitRating,
}) => {
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // Get all media
  const allMedia = [
    ...(product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [DEFAULT_IMG]
    ),
    ...(product.video ? [product.video] : [])
  ];

  const handleSubmit = async () => {
    if (!onSubmitRating) return;
    if (ratingValue < 1 || ratingValue > 5) {
      setRatingError("Please select 1 to 5 stars.");
      return;
    }
    setRatingSubmitting(true);
    setRatingError(null);
    try {
      await onSubmitRating(ratingValue, ratingMessage.trim());
      setRatingValue(0);
      setRatingMessage("");
    } catch {
      setRatingError("Error submitting rating. Try again later.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const isVideo = (url: string) => {
    return url === product.video || url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg');
  };

  const nextMedia = () => {
    setSelectedMediaIndex((prev) => (prev + 1) % allMedia.length);
  };

  const prevMedia = () => {
    setSelectedMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden aspect-square">
                {isVideo(allMedia[selectedMediaIndex]) ? (
                  <video
                    controls
                    className="w-full h-full object-contain"
                    key={allMedia[selectedMediaIndex]}
                  >
                    <source src={allMedia[selectedMediaIndex]} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={allMedia[selectedMediaIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMG;
                    }}
                  />
                )}

                {/* Navigation Arrows */}
                {allMedia.length > 1 && (
                  <>
                    <button
                      onClick={prevMedia}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextMedia}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {allMedia.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedMediaIndex + 1} / {allMedia.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {allMedia.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allMedia.map((media, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMediaIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === selectedMediaIndex
                          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {isVideo(media) ? (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <div className="w-4 h-4 bg-black/70 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={media}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_IMG;
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Category */}
              {product.category && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                  {product.category}
                </div>
              )}

              {/* Rating Summary */}
              {product.averageRating !== undefined && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-yellow-500">
                      {(product.averageRating || 0).toFixed(1)}
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={`${
                            star <= Math.round(product.averageRating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {product.ratingCount || 0} review{(product.ratingCount || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {product.description || "No description available."}
                </p>
              </div>

              {/* Rating Section */}
              {onSubmitRating && (
                <div className="border-t dark:border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Share Your Experience</h3>

                  {product.ratings && Object.keys(product.ratings).includes(getUserId()) ? (
                    <div className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      You've already shared your feedback for this product.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Star Rating */}
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRatingValue(star)}
                            className="p-1 transform hover:scale-110 transition-transform"
                          >
                            <Star
                              size={32}
                              className={`${
                                star <= ratingValue
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Comment */}
                      <textarea
                        placeholder="Share your thoughts... (optional)"
                        rows={3}
                        value={ratingMessage}
                        onChange={(e) => setRatingMessage(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-3 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      {ratingError && (
                        <div className="text-red-600 dark:text-red-400 text-sm">{ratingError}</div>
                      )}

                      <button
                        onClick={handleSubmit}
                        disabled={ratingSubmitting || ratingValue === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                      >
                        {ratingSubmitting ? 'Sharing...' : 'Share Review'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* User Reviews */}
              {product.ratings && Object.keys(product.ratings).length > 0 && (
                <div className="border-t dark:border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Customer Reviews ({Object.keys(product.ratings).length})
                  </h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {Object.values(product.ratings)
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((rating, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium uppercase">
                              {(rating.userId ?? '').startsWith('anon-') ? 'A' : 'U'}
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  size={14}
                                  className={`${
                                    star <= rating.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                              {new Date(rating.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          {rating.message && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                              {rating.message}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
