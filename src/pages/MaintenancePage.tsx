import { Link } from 'react-router-dom';
import { Construction, MessageCircle, Home } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface MaintenancePageProps {
  pageName?: string;
  isUnderConstruction?: boolean;
  message?: string;
}

export default function MaintenancePage({
  pageName,
  isUnderConstruction = true,
  message,
}: MaintenancePageProps) {
  const { get: getSetting } = useSiteSettings();
  const storeName = getSetting('store_name') || 'Decor Drapes Instyle';
  const supportPhone = getSetting('primary_phone') || '+91 98765 43210';

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex items-center justify-center px-4 sm:px-6 py-16 transition-colors">
      <div className="w-full max-w-lg mx-auto text-center space-y-6">
        {/* Brand Label */}
        <span className="text-[11px] font-mono tracking-widest text-neutral-400 dark:text-neutral-500 uppercase block">
          {storeName}
        </span>

        {/* Icon & Status Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shadow-sm">
            <Construction className="w-6 h-6 text-amber-500" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 text-xs font-mono font-medium text-amber-800 dark:text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{isUnderConstruction ? 'UNDER CONSTRUCTION' : 'MAINTENANCE MODE'}</span>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-display">
            {pageName ? `${pageName} is Under Construction` : 'This Page is Under Construction'}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
            {message ||
              'We are currently refining this section with updated collections and design specifications. Please check back shortly.'}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Home size={15} />
            <span>Back to Home</span>
          </Link>

          <a
            href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hello ${storeName}, I wanted to inquire about ${pageName || 'your services'}.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <MessageCircle size={15} />
            <span>Inquire on WhatsApp</span>
          </a>
        </div>
      </div>
    </main>
  );
}
