import type { ReactNode } from 'react';
import { isPageActive, PageKey } from '../../config/pageStatus';
import MaintenancePage from '../../pages/MaintenancePage';

interface PageRouteGuardProps {
  page: PageKey;
  pageName: string;
  children: ReactNode;
}

export function PageRouteGuard({
  page,
  pageName,
  children,
}: PageRouteGuardProps) {
  if (!isPageActive(page)) {
    return <MaintenancePage pageName={pageName} isUnderConstruction />;
  }
  return <>{children}</>;
}

export default PageRouteGuard;
