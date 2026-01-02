import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    imageUrl?: string;
    images?: string[];
  };
  onViewDetails: () => void;
}

export default function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const DEFAULT_IMG = "https://via.placeholder.com/600x400?text=No+Image";

  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : [DEFAULT_IMG];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [allImages.length]);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
  };

  return (
    <div
      className="cursor-pointer bg-white dark:bg-neutral-900 rounded-xl shadow-sm hover:shadow-md transition flex flex-col w-40 md:w-60 lg:w-72 overflow-hidden"
      onClick={onViewDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onViewDetails();
      }}
    >
      {/* Image Container */}
      <div className="w-full aspect-square overflow-hidden rounded-t-xl relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.img
            key={allImages[currentImageIndex]}
            src={allImages[currentImageIndex]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_IMG;
            }}
            variants={slideVariants}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          />
        </AnimatePresence>

        {/* Slideshow Indicators */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
            {allImages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? "bg-gray-900 dark:bg-white scale-110"
                    : "bg-gray-300 dark:bg-gray-500"
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded-full p-1 transition shadow-sm z-10"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded-full p-1 transition shadow-sm z-10"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Product Name */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-medium text-sm mb-2 truncate text-gray-900 dark:text-gray-100">
          {product.name}
        </h3>
      </div>
    </div>
  );
}
