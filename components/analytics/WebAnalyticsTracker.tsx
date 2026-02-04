'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const SESSION_KEY = 'lpbe_analytics_session';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 min

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

export function WebAnalyticsTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/_next') || pathname.startsWith('/api')) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    const sessionId = getOrCreateSessionId();
    const { browser, os, deviceType } = parseUserAgent(navigator.userAgent);

    const payload = {
      path: pathname,
      fullUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      title: typeof document !== 'undefined' ? document.title : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      userAgent: navigator.userAgent,
      screenW: typeof screen !== 'undefined' ? screen.width : undefined,
      screenH: typeof screen !== 'undefined' ? screen.height : undefined,
      viewportW: typeof window !== 'undefined' ? window.innerWidth : undefined,
      viewportH: typeof window !== 'undefined' ? window.innerHeight : undefined,
      deviceType,
      browser,
      os,
      source: 'web' as const,
      sessionId,
    };

    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
