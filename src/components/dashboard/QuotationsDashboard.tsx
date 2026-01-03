import React, { useState, useEffect } from 'react';
import QuotationModal from '../product/QuotationModal';
import { Eye, ChevronRight } from 'lucide-react';

interface Quotation {
  quotationNumber: string;
  customer: {
    name: string;
    email: string;
  };
  grandTotal: number;
  createdAt: number;
  status: string;
  items: any[];
}

interface QuotationsDashboardProps {
  quotations: Quotation[];
}

const QuotationsDashboard: React.FC<QuotationsDashboardProps> = ({ quotations }) => {
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (quotations.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-100 mb-4">My Quotations</h2>
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow text-center">
          <p className="text-gray-600 dark:text-neutral-300">You have no quotations yet.</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-100 mb-4">My Quotations</h2>
        <div className="space-y-3">
          {quotations.map((quotation) => (
            <div 
              key={quotation.quotationNumber} 
              className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow flex items-center justify-between"
              onClick={() => setSelectedQuotation(quotation)}
            >
              <div>
                <p className="font-semibold text-gray-800 dark:text-neutral-100">{quotation.quotationNumber}</p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">{new Date(quotation.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">₹{quotation.grandTotal.toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  quotation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>{quotation.status}</span>
              </div>
              <ChevronRight className="text-gray-400 dark:text-neutral-500" />
            </div>
          ))}
        </div>
        {selectedQuotation && <QuotationModal quotation={selectedQuotation} onClose={() => setSelectedQuotation(null)} />}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-100 mb-4">My Quotations</h2>
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
            <thead className="bg-gray-50 dark:bg-neutral-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
              {quotations.map((quotation) => (
                <tr key={quotation.quotationNumber}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-neutral-100">{quotation.quotationNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-300">{new Date(quotation.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-300">₹{quotation.grandTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      quotation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>{quotation.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => setSelectedQuotation(quotation)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedQuotation && <QuotationModal quotation={selectedQuotation} onClose={() => setSelectedQuotation(null)} />}
    </div>
  );
};

export default QuotationsDashboard;