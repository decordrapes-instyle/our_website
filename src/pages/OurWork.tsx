import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
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
}

const OurWorkPublic: React.FC<OurWorkPublicProps> = ({
  horizontalPreview = false,
  previewCount,
  items: propItems
}) => {
  const [items, setItems] = useState<WorkItem[]>(propItems || []);
  const [loading, setLoading] = useState(propItems ? false : true);
  const [index, setIndex] = useState<number | null>(null);
  const [columns, setColumns] = useState(2); // Default to 2 columns for mobile

  // Calculate column count based on screen size
  useEffect(() => {
    if (horizontalPreview) return;
    
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);        // Mobile
      else if (width < 768) setColumns(3);   // Small screens
      else if (width < 1024) setColumns(4);  // Tablets
      else setColumns(5);                     // Desktops
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

  // Skeleton loader with random heights for masonry feel
  const Skeleton = () => (
    <div 
      className="animate-pulse bg-gray-300 rounded-lg w-full"
      style={{ height: `${200 + Math.random() * 200}px` }}
    />
  );

  // Render individual item card
  const renderItem = (item: WorkItem, _i: number) => {
    return (
      <div 
        key={item.id}
        className={`
          bg-white rounded-2xl shadow-md overflow-hidden
          transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg
          ${horizontalPreview ? 'flex-shrink-0 w-72' : 'w-full mb-4'}
        `}
        onClick={() => {
          if (item.type === 'image') {
            const imageIndex = imageItems.findIndex(img => img.id === item.id);
            if (imageIndex !== -1) setIndex(imageIndex);
          }
        }}
      >
        {item.type === 'video' && item.videoUrl ? (
          <div className="relative pb-[56.25%]"> {/* 16:9 aspect for videos */}
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
          // Images with original aspect ratio
          <div className="w-full">
            <img 
              src={item.url || '/placeholder-work.jpg'} 
              alt={item.title || 'Our work item'} 
              className="w-full rounded-t-2xl"
              style={{ height: 'auto' }}
              loading="lazy"
            />
          </div>
        )}
        <div className="p-4">
          
          {item.caption && (
            <p className="text-gray-600 text-sm line-clamp-2">{item.caption}</p>
          )}
          {item.category && (
            <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {item.category}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={horizontalPreview ? "w-full" : "max-w-7xl mx-auto px-4 py-8"}>
      {!horizontalPreview && (
        <h1 className="text-3xl font-bold text-center mb-8">
          Our Work
        </h1>
      )}

      {/* Horizontal preview mode */}
      {horizontalPreview ? (
        <div className="flex gap-4 w-full overflow-x-auto pb-4 hide-scrollbar">
          {loading
            ? Array(previewCount || 8).fill(0).map((_, i) => <Skeleton key={i} />)
            : items.map((item, i) => renderItem(item, i))}
        </div>
      ) : (
        /* Masonry grid mode */
        <div
          className="masonry-grid"
          style={{
            '--columns': columns,
            '--gap': '1rem',
          } as React.CSSProperties}
        >
          {columnsArray.map((column, colIndex) => (
            <div key={`col-${colIndex}`} className="masonry-column">
              {loading
                ? Array(5).fill(0).map((_, i) => <Skeleton key={`skeleton-${colIndex}-${i}`} />)
                : column.map((item) => renderItem(item, items.findIndex(i => i.id === item.id)))}
            </div>
          ))}
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
        
        img {
          display: block;
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
};

export default OurWorkPublic;
