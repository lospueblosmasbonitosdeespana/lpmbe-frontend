'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
          responseType?: string;
          responseMode?: string;
        }) => void;
        signIn: () => Promise<{
          authorization?: { id_token: string };
          user?: unknown;
        }>;
      };
    };
  }
}

const APPLE_SDK_URL =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

function formatAppleError(err: unknown): string {
  if (err == null) return 'Error al iniciar sesión con Apple';
  if (typeof err === 'object') {
    const o = err as Record<string, unknown>;
    const parts = [
      o.error != null ? String(o.error) : '',
      o.message != null ? String(o.message) : '',
      o.code != null ? String(o.code) : '',
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(' — ');
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export default function AppleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sdkLoadedRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const redirectURI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ?? '';

  if (typeof window !== 'undefined' && !redirectURI && clientId) {
    console.error(
      '[AppleSignIn] NEXT_PUBLIC_APPLE_REDIRECT_URI no está definida. Apple Sign-In usa exclusivamente staging: https://staging.lospueblosmasbonitosdeespana.org/auth/callback/apple'
    );
  }

  const loadSdk = useCallback((): Promise<void> => {
    if (typeof window === 'undefined') return Promise.resolve();
    if (sdkLoadedRef.current && window.AppleID?.auth) return Promise.resolve();

    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-apple-sdk]')) {
        if (window.AppleID?.auth) {
          sdkLoadedRef.current = true;
          resolve();
        } else {
          const check = setInterval(() => {
            if (window.AppleID?.auth) {
              clearInterval(check);
              sdkLoadedRef.current = true;
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(check);
            if (!window.AppleID?.auth) reject(new Error('Apple SDK timeout'));
          }, 5000);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = APPLE_SDK_URL;
      script.async = true;
      script.setAttribute('data-apple-sdk', 'true');
      script.onload = () => {
        if (window.AppleID?.auth) {
          sdkLoadedRef.current = true;
          resolve();
        } else {
          reject(new Error('Apple SDK no expuso AppleID.auth'));
        }
      };
      script.onerror = () => reject(new Error('No se pudo cargar Apple SDK'));
      document.head.appendChild(script);
    });
  }, []);

  useEffect(() => {
    if (!clientId || !redirectURI || typeof window === 'undefined') return;

    loadSdk()
      .then(() => {
        window.AppleID?.auth.init({
          clientId,
          scope: 'name email',
          redirectURI,
          usePopup: false,
          responseType: 'id_token',
          responseMode: 'form_post',
        });
      })
      .catch((err) => {
        console.error('[AppleSignIn] init error:', err);
        setError(formatAppleError(err));
      });
  }, [clientId, redirectURI, loadSdk]);

  const handleClick = useCallback(async () => {
    if (!clientId) {
      setError('Falta configuración (NEXT_PUBLIC_APPLE_CLIENT_ID)');
      return;
    }
    if (!redirectURI) {
      setError('Falta configuración (NEXT_PUBLIC_APPLE_REDIRECT_URI). Usar staging: https://staging.lospueblosmasbonitosdeespana.org/auth/callback/apple');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await loadSdk();
      const auth = window.AppleID?.auth;
      if (!auth) {
        setError('Inicio de sesión con Apple no disponible');
        setLoading(false);
        return;
      }
      // Redirect flow: signIn() redirige la ventana a Apple; el callback /auth/callback/apple procesa el retorno
      await auth.signIn();
      // Si no hay redirect (p.ej. Safari bloqueó), seguimos aquí
      setLoading(false);
    } catch (err: unknown) {
      console.error('[AppleSignIn]', err);
      setError(formatAppleError(err));
      setLoading(false);
    }
  }, [clientId, redirectURI, loadSdk]);

  if (!clientId || !redirectURI) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-black px-3 py-2.5 text-white hover:bg-gray-900 disabled:opacity-50"
        aria-label="Continuar con Apple"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        {loading ? 'Conectando…' : 'Continuar con Apple'}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
