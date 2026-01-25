import { loadStripe, Stripe } from '@stripe/stripe-js';

// Variable de entorno (puede estar vacía o no existir)
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';

// Verifica si Stripe está configurado correctamente
export const isStripeEnabled = (): boolean => {
  return STRIPE_PUBLISHABLE_KEY.startsWith('pk_');
};

// Loader seguro: devuelve null si Stripe no está configurado
// NUNCA llama loadStripe("") para evitar el crash
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> | null => {
  if (!isStripeEnabled()) {
    return null;
  }

  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }

  return stripePromise;
};
