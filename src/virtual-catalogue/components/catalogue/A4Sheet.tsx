import React from 'react';
import { Product } from '../../types/catalogue';
import { ProductCard } from './ProductCard';

interface A4SheetProps {
  pageNumber: number;
  brandTitle: string;
  catalogueTitle: string;
  products: Product[];
  currency?: string;
  onOpenDetail: (code: string) => void;
}

export const A4Sheet: React.FC<A4SheetProps> = ({
  pageNumber,
  brandTitle,
  catalogueTitle,
  products,
  currency = '₹',
  onOpenDetail,
}) => {
  return (
    <section className="sheet">
      <div className="in">
        {/* Header */}
        <div className="hd">
          <span>{brandTitle}</span>
          <span>{catalogueTitle}</span>
        </div>

        {/* Body (2 cards per A4 sheet) */}
        <div className="bd">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              currency={currency}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="ft">
          <span>{brandTitle}</span>
          <span>{pageNumber}</span>
        </div>
      </div>
    </section>
  );
};
