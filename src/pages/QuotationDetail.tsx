import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from '../config/firebase';
import { database } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  FileText, Tag, Calendar, DollarSign, User, Mail, Phone, MapPin, Loader2, Package, CheckCircle, XCircle
} from 'lucide-react';

// Define the Quotation type (similar to the one in Quotations.tsx, but more detailed)
interface Quotation {
  id: string;
  quotation_no: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
    address?: string;
  };
  status: string;
  totalAmount: number;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  createdAt: string;
  lastUpdated?: string;
}

const QuotationDetail: React.FC = () => {
  const { quotationId } = useParams<{ quotationId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      setError('User not logged in or email not available.');
      setLoading(false);
      return;
    }

    if (!quotationId) {
      setError('Quotation ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const quotationRef = ref(database, `quotations/quotationList/${quotationId}`);

    const unsubscribe = onValue(quotationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Quotation;

        // Enforce client-side rule check as well, though Firebase rules should handle this
        if (data.customer.email !== currentUser.email) {
          setError('You do not have permission to view this quotation.');
          setQuotation(null);
          setLoading(false);
          toast.error('Access Denied: You can only view your own quotations.');
          navigate('/quotations'); // Redirect to the list if unauthorized
          return;
        }

        setQuotation({ id: quotationId, ...data });
      } else {
        setError('Quotation not found.');
        setQuotation(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firebase fetch error:", err);
      setError("Failed to load quotation details. Please try again.");
      setLoading(false);
      toast.error('Failed to load quotation details.');
    });

    return () => {
      unsubscribe();
    };
  }, [quotationId, currentUser, navigate]);

  const getStatusBadgeClass = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-300';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-700 dark:text-gray-300">Loading quotation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-neutral-950 p-4 text-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/quotations')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Quotations List
          </button>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-neutral-950 p-4 text-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Quotation Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The quotation you are looking for does not exist or you do not have access to it.</p>
          <button
            onClick={() => navigate('/quotations')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Quotations List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3 mb-2">
                <FileText className="w-7 h-7 text-blue-600" />
                Quotation #{quotation.quotation_no}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                For: <span className="font-medium">{quotation.customer.name}</span>
              </p>
            </div>
            <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadgeClass(quotation.status)}`}>
              {quotation.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Customer Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" /> Customer Information
              </h2>
              <p className="flex items-center text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4 mr-2 text-gray-500" /> {quotation.customer.email}
              </p>
              {quotation.customer.phone && (
                <p className="flex items-center text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" /> {quotation.customer.phone}
                </p>
              )}
              {quotation.customer.address && (
                <p className="flex items-start text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 mr-2 mt-1 text-gray-500 flex-shrink-0" /> {quotation.customer.address}
                </p>
              )}
            </div>

            {/* Quotation Summary */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" /> Dates
              </h2>
              <p className="flex items-center text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" /> Created On: {new Date(quotation.createdAt).toLocaleDateString()}
              </p>
              {quotation.lastUpdated && (
                <p className="flex items-center text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" /> Last Updated: {new Date(quotation.lastUpdated).toLocaleDateString()}
                </p>
              )}
              <div className="pt-4 text-right">
                <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center justify-end gap-2">
                  <DollarSign className="w-6 h-6 text-emerald-600" /> Total: ${quotation.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Quotation Items */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-orange-500" /> Items
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Item</th>
                    <th className="py-3 px-6 text-left">Description</th>
                    <th className="py-3 px-6 text-center">Qty</th>
                    <th className="py-3 px-6 text-right">Unit Price</th>
                    <th className="py-3 px-6 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300 text-sm font-light">
                  {quotation.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-6 text-left whitespace-nowrap font-medium">{item.name}</td>
                      <td className="py-3 px-6 text-left">{item.description || '-'}</td>
                      <td className="py-3 px-6 text-center">{item.quantity}</td>
                      <td className="py-3 px-6 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-6 text-right">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold text-base">
                    <td colSpan={4} className="py-3 px-6 text-right">Grand Total:</td>
                    <td className="py-3 px-6 text-right">${quotation.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-500" /> Notes
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {quotation.notes}
              </div>
            </div>
          )}

          <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate('/quotations')}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center mx-auto"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Quotations List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add ArrowLeft icon, if not already imported
import { ArrowLeft } from 'lucide-react';

export default QuotationDetail;
