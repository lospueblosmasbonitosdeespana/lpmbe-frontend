'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const SESSION_KEY = 'lpbe_analytics_session';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 min
const APP_GEO_SENT_KEY = 'lpbe_analytics_app_geo_sent';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const { id, ts } = JSON.parse(stored);
      if (Date.now() - ts < SESSION_DURATION_MS) return id;
    }
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() }));
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

function parseUserAgent(ua: string) {
  let browser = 'desconocido';
  let os = 'desconocido';
  let deviceType = 'desktop';

  if (/Mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = /iPad|Tablet|PlayBook|Silk/i.test(ua) ? 'tablet' : 'mobile';
  }

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os, deviceType };
}

function getLocaleAndTimezone() {
  const language =
    typeof navigator !== 'undefined'
      ? (navigator.language || (navigator.languages && navigator.languages[0]) || '')
      : '';
  const timezone =
    typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      : '';
  return { language, timezone };
}

function guessCountryCode(language: string, timezone: string): string {
  const lang = String(language || '').toLowerCase();
  const tz = String(timezone || '');
  const localeRegion = lang.includes('-') ? lang.split('-')[1]?.toUpperCase() || '' : '';
  if (localeRegion.length === 2) return localeRegion;
  if (tz === 'Europe/Madrid' || tz === 'Atlantic/Canary') return 'ES';
  return 'UNK';
}

function detectAnalyticsSource(pathname: string, ua: string): 'web' | 'app' {
  if (typeof window === 'undefined') return 'web';

  const params = new URLSearchParams(window.location.search);
  const rawSource = (
    params.get('source') ??
    params.get('src') ??
    params.get('from') ??
    params.get('utm_source') ??
    ''
  ).toLowerCase();

  if (['app', 'ios-app', 'android-app', 'mobile-app', 'lpmbe-app'].includes(rawSource)) {
    return 'app';
  }

  const uaLower = ua.toLowerCase();
  const appUaHint =
    uaLower.includes('pueblos_bonitos_app') ||
    uaLower.includes('lpmbeapp') ||
    uaLower.includes('lpmbe-app') ||
    uaLower.includes('app.rork.pueblos_bonitos_app');

  const isLikelyWebView =
    uaLower.includes('; wv') ||
    uaLower.includes(' wv)') ||
    uaLower.includes('webview');

  if (appUaHint || isLikelyWebView) return 'app';

  // Fallback defensivo: rutas de puente de descarga siempre computan como web.
  if (pathname === '/app') return 'web';

  return 'web';
}

export function WebAnalyticsTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/_next') || pathname.startsWith('/api')) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    const sessionId = getOrCreateSessionId();
    const ua = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(ua);
    const source = detectAnalyticsSource(pathname, ua);
    const { language, timezone } = getLocaleAndTimezone();
    const countryCode = guessCountryCode(language, timezone);

    const payload = {
      path: pathname,
      fullUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      title: typeof document !== 'undefined' ? document.title : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      userAgent: ua,
      screenW: typeof screen !== 'undefined' ? screen.width : undefined,
      screenH: typeof screen !== 'undefined' ? screen.height : undefined,
      viewportW: typeof window !== 'undefined' ? window.innerWidth : undefined,
      viewportH: typeof window !== 'undefined' ? window.innerHeight : undefined,
      deviceType,
      browser,
      os,
      source,
      sessionId,
    };

    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});

    // Registrar metadatos geo de uso app una sola vez por sesión
    if (source === 'app') {
      const geoSentKey = `${APP_GEO_SENT_KEY}:${sessionId}`;
      let alreadySent = false;
      try {
        alreadySent = sessionStorage.getItem(geoSentKey) === '1';
      } catch {
        alreadySent = false;
      }

      if (!alreadySent) {
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName: 'app_geo',
            eventCategory: 'app_usage',
            path: pathname,
            source: 'app',
            sessionId,
            extra: {
              language,
              timezone,
              countryCode,
            },
          }),
          keepalive: true,
        }).catch(() => {});
        try {
          sessionStorage.setItem(geoSentKey, '1');
        } catch {
          // ignore storage issues
        }
      }
    }
  }, [pathname]);

  return null;
}
