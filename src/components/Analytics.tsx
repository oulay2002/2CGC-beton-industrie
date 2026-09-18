"use client";

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { trackPageView } from '@/lib/analytics';

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    const url = pathname + (query ? `?${query}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>

      {/* Script officiel Google Analytics 4 (activé automatiquement si NEXT_PUBLIC_GA_ID est défini) */}
      {gaId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}
    </>
  );
}
