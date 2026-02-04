/**
 * Utilidad para enviar eventos de analytics al backend.
 * Usar para clicks, conversiones, etc.
 */
export function trackEvent(
  eventName: string,
  options?: {
    category?: string;
    label?: string;
    value?: number;
    path?: string;
    extra?: Record<string, unknown>;
  }
) {
  if (typeof window === 'undefined') return;
  const sessionId = getSessionId();
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      eventCategory: options?.category,
      eventLabel: options?.label,
      eventValue: options?.value,
      path: options?.path ?? window.location.pathname,
      extra: options?.extra,
      source: 'web',
      sessionId,
    }),
    keepalive: true,
  }).catch(() => {});
}

function getSessionId(): string {
  try {
    const stored = sessionStorage.getItem('lpbe_analytics_session');
    if (stored) {
      const { id } = JSON.parse(stored);
      return id ?? '';
    }
  } catch {}
  return '';
}
