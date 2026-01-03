import React, { useState, useRef } from 'react';
import { X, Download, Loader } from 'lucide-react';
import { generateQuotationPDF } from '../../utils/pdf';
import toast from 'react-hot-toast';

const DetailBadge = ({ label, value, unit = '' }: { label: string, value: string | number, unit?: string }) => {
    if (!value || value === 0) return null;
    const displayValue = typeof value === 'number' ? Math.ceil(value) : value;
    return (
        <span className="bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-neutral-200 text-xs font-medium me-2 px-2.5 py-1 rounded-full">
            {label}: {displayValue} {unit}
        </span>
    );
};

const QuotationModal = ({ quotation, onClose }: { quotation: any; onClose: () => void }) => {
    if (!quotation) return null;

    const [isDownloading, setIsDownloading] = useState(false);
    const touchStartY = useRef(0);
    const modalContentRef = useRef<HTMLDivElement>(null);

    const subTotal = quotation.grandTotal - quotation.taxAmount;
    const taxRate = subTotal > 0 ? (quotation.taxAmount / subTotal) * 100 : 0;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await generateQuotationPDF(quotation);
            toast.success('PDF downloaded successfully!');
        } catch (error) {
            toast.error('Failed to generate PDF.');
            console.error(error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartY.current = e.targetTouches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (modalContentRef.current && modalContentRef.current.scrollTop === 0) {
            const touchCurrentY = e.targetTouches[0].clientY;
            if (touchCurrentY > touchStartY.current + 10) { // Check for downward swipe
                e.preventDefault(); // Prevent page scroll
            }
        }
    };
    
    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchEndY > touchStartY.current + 100) { // Swipe down threshold
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-end md:items-center animate-fadeIn" onTouchMove={handleTouchMove}>
            <div 
                ref={modalContentRef}
                className="bg-white dark:bg-neutral-900 rounded-t-2xl md:rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mb-4 md:hidden"></div>
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-neutral-700 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quotation Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-full bg-gray-100 dark:bg-neutral-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="flex items-start space-x-4">
                        <img src={quotation.company.companyLogo} alt={quotation.company.companyName} className="h-12 w-32 object-contain" />
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-neutral-100">{quotation.company.companyName}</h3>
                            <p className="text-sm text-gray-500 dark:text-neutral-400">{quotation.company.companyAddress}</p>
                            <p className="text-sm text-gray-500 dark:text-neutral-400">{quotation.company.companyEmail}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl">
                        <h4 className="font-semibold mb-2 text-gray-700 dark:text-neutral-200">Billed to:</h4>
                        <p className="font-bold text-gray-800 dark:text-neutral-100">{quotation.customer.name}</p>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">{quotation.customer.email}</p>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">{quotation.customer.address}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-neutral-100">Items</h3>
                    <div className="space-y-4">
                        {quotation.items.map((item: any) => (
                            <div key={item.id} className="p-4 rounded-xl border border-gray-200 dark:border-neutral-700 transition-shadow hover:shadow-md">
                                <div className="md:flex justify-between items-start">
                                    <div className="flex-1 mb-4 md:mb-0">
                                        <p className="font-semibold text-gray-800 dark:text-neutral-100">{item.product.productName}</p>
                                        <p className="text-sm text-gray-500 dark:text-neutral-400">{item.product.productCategory}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <DetailBadge label="Qty" value={item.qty} unit="pcs" />
                                            <DetailBadge label="Width" value={item.width} unit={item.widthUnit} />
                                            <DetailBadge label="Height" value={item.height} unit={item.heightUnit} />
                                            <DetailBadge label="Sqft" value={item.sqft} />
                                            <DetailBadge label="Running Feet" value={item.runningFeet} />
                                        </div>
                                    </div>
                                    <div className="flex md:block items-center gap-2 text-left md:text-right">
                                        <p className="font-semibold text-lg text-gray-900 dark:text-white">
                                            ₹{item.amount.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-neutral-400">
                                            @ ₹{item.price.toFixed(2)} / {item.product.unit}
                                        </p>
                                        </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t-2 border-dashed border-gray-200 dark:border-neutral-700 pt-6">
                    <div className="max-w-sm ml-auto space-y-3">
                        <div className="flex justify-between text-base">
                            <span className="text-gray-600 dark:text-neutral-300">Subtotal:</span>
                            <span className="font-medium text-gray-800 dark:text-neutral-100">₹{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base">
                            <span className="text-gray-600 gap-2 dark:text-neutral-300 flex items-center">
                                Tax <DetailBadge label="Rate" value={`${Math.round(taxRate)}%`} />
                            </span>
                            <span className="font-medium text-gray-800 dark:text-neutral-100">₹{quotation.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 dark:border-neutral-700 pt-3 mt-3">
                            <span className="font-bold text-xl text-gray-900 dark:text-white">Grand Total:</span>
                            <span className="font-bold text-xl text-gray-900 dark:text-white">₹{quotation.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 border-t border-gray-200 dark:border-neutral-700 pt-6 flex justify-end">
                    <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black px-6 py-3 rounded-full hover:bg-neutral-900 dark:hover:bg-white disabled:opacity-50 flex items-center gap-2 font-medium transition-transform active:scale-95"
                    >
                        {isDownloading ? <Loader className="animate-spin" /> : <Download />}
                        {isDownloading ? 'Downloading...' : 'Download PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuotationModal;