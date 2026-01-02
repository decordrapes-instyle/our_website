import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from '../config/firebase';
import { database as db } from '../config/firebase';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

interface WorkItem {
  id: string;
  url?: string;
  caption?: string;
  type?: 'image' | 'video';
  videoUrl?: string;
  category?: string;
  title?: string;
  width?: number;
  height?: number;
}

interface OurWorkPublicProps {
  horizontalPreview?: boolean;
  previewCount?: number;
  items?: WorkItem[];
  showTitle?: boolean;
}

const OurWorkPublic: React.FC<OurWorkPublicProps> = ({
  horizontalPreview = false,
  previewCount,
  items: propItems,
  showTitle = true
}) => {
  const [items, setItems] = useState<WorkItem[]>(propItems || []);
  const [loading, setLoading] = useState(propItems ? false : true);
  const [index, setIndex] = useState<number | null>(null);
  const [columns, setColumns] = useState(2);

  // Calculate column count based on screen size
  useEffect(() => {
    if (horizontalPreview) return;
    
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);
      else if (width < 768) setColumns(3);
      else if (width < 1024) setColumns(4);
      else setColumns(5);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [horizontalPreview]);

  // Fetch items from Firebase if not provided via props
  useEffect(() => {
    if (!propItems) {
      const unsubscribe = onValue(ref(db, "ourWork"), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const arr: WorkItem[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
            title: data[key].caption || 'Our Work',
          }));

          setItems(previewCount ? arr.slice(0, previewCount) : arr);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [horizontalPreview, previewCount, propItems]);

  // Create image-only array for lightbox
  const imageItems = useMemo(() => 
    items.filter(item => item.type === "image"), 
    [items]
  );

  // Group items into columns for masonry layout
  const columnsArray = useMemo(() => {
    if (horizontalPreview) return [];
    
    const columnsArr: WorkItem[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, index) => {
      columnsArr[index % columns].push(item);
    });
    return columnsArr;
  }, [items, columns, horizontalPreview]);

  // Skeleton loader
  const Skeleton = () => (
    <div 
      className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl w-full"
      style={{ height: `${200 + Math.random() * 200}px` }}
    />
  );

  // Render individual item card
  const renderItem = (item: WorkItem) => {
    return (
      <div 
        key={item.id}
        className={`
          group relative bg-white dark:bg-neutral-900 
          rounded-2xl shadow-lg hover:shadow-2xl dark:shadow-neutral-800/50 
          overflow-hidden transition-all duration-300
          ${horizontalPreview ? 'flex-shrink-0 w-72 mx-2' : 'w-full mb-4'}
        `}
        onClick={() => {
          if (item.type === 'image') {
            const imageIndex = imageItems.findIndex(img => img.id === item.id);
            if (imageIndex !== -1) setIndex(imageIndex);
          }
        }}
      >
        {/* Media type indicator */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${item.type === 'video' 
              ? 'bg-red-500/90 text-white' 
              : 'bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300'
            }
          `}>
            {item.type === 'video' ? 'Video' : 'Image'}
          </div>
        </div>

        {item.type === 'video' && item.videoUrl ? (
          <div className="relative pb-[56.25%]">
            <iframe
              src={item.videoUrl}
              className="absolute inset-0 w-full h-full object-cover rounded-t-2xl"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={item.title}
            />
          </div>
        ) : (
          <div className="relative overflow-hidden">
            <img 
              src={item.url || '/placeholder-work.jpg'} 
              alt={item.title || 'Our work item'} 
              className="w-full h-auto rounded-t-2xl group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* View overlay for images */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-t-2xl" />
          </div>
        )}
        
        <div className="p-3">
          {item.caption && (
            <p className="text-neutral-600 dark:text-neutral-400 text-sm ">
              {item.caption}
            </p>
          )}
          {item.category && (
            <button className="
              bg-neutral-100 dark:bg-neutral-800 
              hover:bg-neutral-200 dark:hover:bg-neutral-700
              text-neutral-700 dark:text-neutral-300 
              text-sm px-4 py-2 rounded-full transition-colors
            ">
              {item.category}
            </button>
          )}
        </div>

        {/* View button overlay for images */}
        {item.type === 'image' && (
          <div className="
            absolute inset-0 flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
            bg-black/20 rounded-2xl pointer-events-none
          ">
            <div className="
              bg-white/90 dark:bg-neutral-900/90 
              text-neutral-900 dark:text-white
              px-6 py-3 rounded-full font-medium shadow-lg
            ">
              View Full Size
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={horizontalPreview ? "w-full" : "dark:bg-neutral-950 bg-neutral-50 max-w-7xl mx-auto px-4 py-8"}>
      {/* Header */}
      {!horizontalPreview && showTitle && (
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-3">
            Our Work
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Explore our latest projects and creative work
          </p>
        </div>
      )}

      {/* Horizontal preview mode */}
      {horizontalPreview ? (
        <div className="flex gap-4 w-full overflow-x-auto pb-6 hide-scrollbar px-4">
          {loading
            ? Array(previewCount || 8).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-72">
                  <Skeleton />
                </div>
              ))
            : items.map((item) => renderItem(item))}
        </div>
      ) : (
        /* Masonry grid mode */
        <div
          className="masonry-grid"
          style={{
            '--columns': columns,
            '--gap': '1.5rem',
          } as React.CSSProperties}
        >
          {columnsArray.map((column, colIndex) => (
            <div key={`col-${colIndex}`} className="masonry-column">
              {loading
                ? Array(5).fill(0).map((_, i) => <Skeleton key={`skeleton-${colIndex}-${i}`} />)
                : column.map((item) => renderItem(item))}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            No Work Available
          </h3>
          <p className="text-neutral-500 dark:text-neutral-500">
            Check back soon for our latest projects
          </p>
        </div>
      )}

      {/* Lightbox for images */}
      {!horizontalPreview && index !== null && (
        <Lightbox
          slides={imageItems.map(i => ({ src: i.url! }))}
          open={index !== null}
          index={index}
          close={() => setIndex(null)}
          plugins={[Zoom, Thumbnails]}
          styles={{
            container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
          }}
        />
      )}

      <style>{`
        .masonry-grid {
          display: grid;
          grid-template-columns: repeat(var(--columns), 1fr);
          gap: var(--gap);
        }
        
        .masonry-column {
          display: flex;
          flex-direction: column;
          gap: var(--gap);
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Better image loading */
        img {
          display: block;
          max-width: 100%;
          height: auto;
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default OurWorkPublic;