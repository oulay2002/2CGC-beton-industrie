// src/lib/analytics.ts — Module Analytics respectueux de la vie privée (RGPD compliant)
// Supporte Google Analytics 4 (GA4) et la télémétrie interne 2CGC sans dépendance lourde

/**
 * gtag est injecte par le script Google Analytics charge dans la page. On le
 * declare plutot que de contourner le typage a chaque appel : la signature est
 * ainsi verifiee, et un appel errone devient une erreur de compilation.
 */
type Gtag = (
  commande: 'event' | 'config' | 'set',
  cible: string,
  parametres?: Record<string, unknown>
) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export function trackEvent({ action, category, label, value }: AnalyticsEvent) {
  if (typeof window === 'undefined') return;

  // 1. Déclencheur GA4 officiel si gtag est configuré dans l'environnement
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  // 2. Télémétrie locale 2CGC (stockage temporaire anonymisé pour supervision dirigeant)
  try {
    const rawHistory = localStorage.getItem('2cgc_analytics_events');
    const history = rawHistory ? JSON.parse(rawHistory) : [];
    history.push({
      action,
      category,
      label,
      value,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
    });
    // Conserver un maximum de 100 événements récents
    if (history.length > 100) history.shift();
    localStorage.setItem('2cgc_analytics_events', JSON.stringify(history));
  } catch {
    // Mode privé ou quota dépassé ignoré en silence
  }
}

export function trackPageView(url: string) {
  if (typeof window === 'undefined') return;

  if (typeof window.gtag === 'function') {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      window.gtag('config', gaId, {
        page_path: url,
      });
    }
  }
}
