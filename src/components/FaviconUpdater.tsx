import { useEffect } from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';

const FaviconUpdater: React.FC = () => {
  const { settings, get } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;
    const url = get('favicon');
    if (url) {
      const link: HTMLLinkElement | null = document.getElementById('dynamic-favicon') as any;
      if (link) link.href = url;
    }
  }, [settings, get]);

  return null;
};

export default FaviconUpdater;
