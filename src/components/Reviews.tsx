import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TestimonialForm from "./testimonials/TestimonialForm";
import { Review, ReviewsProps } from "../types";

const Reviews: React.FC<ReviewsProps> = ({ localReviews }) => {
  const [googleReviews, setGoogleReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<{ [key: string]: boolean }>({});
  const [expandedReviews, setExpandedReviews] = useState<{ [key: string]: boolean }>({});
  const [averageRating, setAverageRating] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showReviewOptions, setShowReviewOptions] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const businessAuthor = {
    name: "Aditya Shah",
    image: "https://lh3.googleusercontent.com/a/ACg8ocJYuOB--Gmc-R1OuACVtr6cHQ_ggylyhoKEAkECBub9t1t5KUOUow=s96-c"
  };

  useEffect(() => {
    const fetchGoogleReviews = async () => {
      try {
        const res = await fetch(
          `https://featurable.com/api/v1/widgets/${import.meta.env.VITE_FEATUREABLE_ID}`
        );
        const data = await res.json();
        const googleReviewsData: Review[] = (data.reviews || []).map((review: any) => ({
          ...review,
          id: review.reviewId,
          source: "google" as const
        }));
        setGoogleReviews(googleReviewsData);
        const allReviews = [...googleReviewsData, ...formatLocalReviews(localReviews)];
        if (allReviews.length) {
          const avg = allReviews.reduce((sum, r) => sum + r.starRating, 0) / allReviews.length;
          setAverageRating(Number(avg.toFixed(1)));
        }
      } catch (err) {
        console.error("Error fetching Google reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGoogleReviews();
  }, [localReviews]);

  const formatLocalReviews = (reviews: ReviewsProps["localReviews"]): Review[] => {
    return reviews.map(review => ({
      id: review.id,
      starRating: review.rating,
      comment: review.content,
      createTime: review.createdAt,
      source: "website" as const,
      title: review.title,
      userName: review.userName,
      userImage: review.userImage,
      reviewer: {
        displayName: review.userName,
        profilePhotoUrl: review.userImage
      }
    }));
  };

  const allReviews = [...googleReviews, ...formatLocalReviews(localReviews)]
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

  const toggleReply = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleReviewExpansion = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const loadMore = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 8);
      setIsLoadingMore(false);
    }, 600);
  }, []);

  const loadLess = useCallback(() => {
    setDisplayCount(6);
    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const shouldTruncate = (text: string) => text.length > 150;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  const displayedReviews = allReviews.slice(0, displayCount);
  const hasMore = displayCount < allReviews.length;
  const showLoadLess = displayCount > 6;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4" id="reviews-section">
      {/* Google Badge with Stats */}
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">{averageRating} out of 5</div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className={`w-6 h-6 ${i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">Based on {allReviews.length} reviews</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          <a
            href="https://search.google.com/local/writereview?placeid=ChIJ81gT5P0VrjsRin99GBddcFE"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-md flex items-center gap-2 border border-gray-200 dark:border-gray-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z"/>
            </svg>
            Write on Google
          </a>

          <button
            onClick={() => setShowReviewOptions(true)}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Write a Review
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showReviewOptions && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReviewOptions(false)}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">How would you like to review?</h3>
              <div className="space-y-4">
                <a
                  href="https://search.google.com/local/writereview?placeid=ChIJ81gT5P0VrjsRin99GBddcFE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Write on Google</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Share your experience publicly on Google</div>
                  </div>
                </a>

                <button
                  onClick={() => {
                    setShowReviewOptions(false);
                    setShowTestimonialForm(true);
                  }}
                  className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full text-left"
                >
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Submit on our website</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Share your feedback directly with us</div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowReviewOptions(false)}
                className="mt-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
        {showTestimonialForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTestimonialForm(false)}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <TestimonialForm
                isOpen={showTestimonialForm}
                onClose={() => setShowTestimonialForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
        <AnimatePresence>
          {displayedReviews.map((review, index) => (
            <motion.div
              key={review.id}
              className="break-inside-avoid bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              layout
            >
              {/* Review Source Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {review.source === "google" ? (
                    <>
                      <svg className="w-3 h-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Google</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>Website</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  {review.reviewer.profilePhotoUrl ? (
                    <img
                      src={review.reviewer.profilePhotoUrl}
                      alt={review.reviewer.displayName}
                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                      <span className="text-white font-semibold">
                        {review.reviewer.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {review.source === "google" && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{review.reviewer.displayName}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {new Date(review.createTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < review.starRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {review.title && (
                <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                  {review.title}
                </h4>
              )}

              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {expandedReviews[review.id]
                    ? review.comment
                    : shouldTruncate(review.comment)
                      ? `${review.comment.substring(0, 150)}...`
                      : review.comment
                  }
                </p>
                {shouldTruncate(review.comment) && (
                  <button
                    onClick={(e) => toggleReviewExpansion(review.id, e)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium mt-2 transition-colors"
                  >
                    {expandedReviews[review.id] ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {review.reviewReply?.comment && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={(e) => toggleReply(review.id, e)}
                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    {expandedReplies[review.id] ? 'Hide response' : 'View response'}
                    <motion.svg
                      className="w-4 h-4 ml-1"
                      animate={{ rotate: expandedReplies[review.id] ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </motion.svg>
                  </button>
                </div>
              )}

              <AnimatePresence>
                {review.reviewReply?.comment && expandedReplies[review.id] && (
                  <motion.div
                    className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mt-4 border border-blue-100 dark:border-blue-800"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={businessAuthor.image}
                        alt={businessAuthor.name}
                        className="w-8 h-8 rounded-full object-cover mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-blue-800 dark:text-blue-200 font-medium text-sm">{businessAuthor.name}</p>
                          <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded-full">Owner</span>
                        </div>
                        <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">{review.reviewReply.comment}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-center mt-8 gap-4">
        {hasMore && (
          <motion.button
            onClick={loadMore}
            className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2"
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Loading...
              </>
            ) : (
              <>
                Load More Reviews
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </motion.button>
        )}

        {showLoadLess && (
          <motion.button
            onClick={loadLess}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            Show Less
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default Reviews;
