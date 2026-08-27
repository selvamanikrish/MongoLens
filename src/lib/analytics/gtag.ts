// Privacy-First Google Analytics (GA4) Integration for MongoLens

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID =
  (import.meta.env && import.meta.env.VITE_GA_MEASUREMENT_ID) || 'G-MONGOLENS1';

export function initGA() {
  if (typeof window === 'undefined') return;

  // If script not already injected
  if (!document.getElementById('ga-gtag-script')) {
    const script = document.createElement('script');
    script.id = 'ga-gtag-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: true,
    });
  }
}

export function trackPageView(pageName: string) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: `/${pageName}`,
    });
  }
}

export function trackEvent(action: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, params);
  }
}

// Specialized Privacy-Safe Tracking Helpers
export function trackFileUpload(fileType: string, fileSizeMB: number, entryCount: number) {
  trackEvent('log_file_uploaded', {
    file_type: fileType,
    file_size_mb: Number(fileSizeMB.toFixed(2)),
    total_entries_bracket: entryCount > 1000000 ? '1M+' : entryCount > 100000 ? '100k-1M' : '<100k',
  });
}

export function trackDemoLoaded() {
  trackEvent('demo_log_loaded');
}

export function trackExportDownloaded(format: string, recordCount: number) {
  trackEvent('export_generated', {
    export_format: format,
    exported_records_count: recordCount,
  });
}

export function trackSlowQueryInspected(plan: string, durationMs: number) {
  trackEvent('query_inspected', {
    plan_type: plan || 'UNKNOWN',
    duration_bracket: durationMs >= 5000 ? '5s+' : durationMs >= 1000 ? '1s-5s' : '100ms-1s',
  });
}
