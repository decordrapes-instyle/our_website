import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Added import
import { ref, query, orderByChild, equalTo, onValue } from '../config/firebase';
import { database } from '../config/firebase';
import { AuthContext } from '../context/AuthContext'; // Assuming AuthContext provides user info
import { SiteSettings } from '../types'; // SiteSettings might still be useful for store name
import { Package, FileText, Calendar, DollarSign } from 'lucide-react'; // Icons for quotation details

// Define a basic type for Quotation based on inferred structure
interface Quotation {
  id: string;
  quotation_no: string;
  customer: {
    email: string;
    name: string;
  };
  status: string;
  totalAmount: number;
  createdAt: string; // Assuming a timestamp or date string
  // Add other fields as necessary from your dummy data
}

const Quotations: React.FC = () => {
  const { currentUser } = useContext(AuthContext); // Get current user from AuthContext
  const navigate = useNavigate(); // Added this line
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [settings, setSettings] = useState<SiteSettings[]>([]); // To get store name if needed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch site settings (like store name)
    const settingsRef = ref(database, 'siteSettings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settingsData = snapshot.val();
        const settingsList: SiteSettings[] = Object.keys(settingsData).map(key => ({
          id: key,
          ...settingsData[key],
        }));
        setSettings(settingsList);
      }
    });

    return () => {
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      setLoading(false);
      setError('User not logged in or email not available.');
      return;
    }

    setLoading(true);
    setError(null);

    // Query quotations for the current user's email
    // The Firebase rules allow reading if customer.email matches auth.uid's email
    // So we need to query by 'customer/email' and filter by the current user's email
    const quotationsRef = ref(database, 'quotations/quotationList');
    const userQuotationsQuery = query(
      quotationsRef,
      orderByChild('customer/email'),
      equalTo(currentUser.email)
    );

    const unsubscribeQuotations = onValue(userQuotationsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loadedQuotations: Quotation[] = Object.keys(data).map(key => ({
          id: key, // Use the quotation number as the id
          ...data[key],
        }));
        setQuotations(loadedQuotations);
      } else {
        setQuotations([]);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firebase fetch error:", err);
      setError("Failed to load quotations. Please try again.");
      setLoading(false);
    });

    return () => {
      unsubscribeQuotations();
    };
  }, [currentUser]); // Re-run when currentUser changes

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || '';
  };

  const storeName = getSetting('store_name');

  const getStatusBadgeClass = (status: string) => {
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

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-24">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 dark:text-gray-100 mb-4">
            Your <span className="font-medium text-blue-600 dark:text-blue-400">Quotations</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            View the status and details of your requested quotations from {storeName}.
          </p>
        </div>

        {loading && (
          <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading quotations...</div>
        )}

        {error && (
          <div className="text-center py-10 text-red-600 dark:text-red-400">{error}</div>
        )}

        {!loading && !error && quotations.length === 0 && (
          <div className="text-center py-10">
            <Package className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">No Quotations Found</p>
            <p className="text-gray-500 dark:text-gray-400">It looks like you haven't requested any quotations yet.</p>
          </div>
        )}

        {!loading && !error && quotations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotations.map((quotation) => (
              <div
                key={quotation.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer"
                onClick={() => navigate(`/quotations/${quotation.id}`)} // Updated navigation
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Quotation #{quotation.quotation_no}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(quotation.status)}`}
                    >
                      {quotation.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Created: {new Date(quotation.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    Total: ${quotation.totalAmount.toFixed(2)}
                  </p>
                  {/* You can add more details here */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotations;
