'use client';

import { Button } from '@/app/components/ui/button';
import { Phone, MessageCircle, CalendarCheck } from 'lucide-react';
import ReservaButton from '@/app/_components/reservas/ReservaButton';

interface Props {
  eyebrow: string;
  title: string;
  reservarOnlineLabel: string;
  llamarLabel: string;
  whatsappLabel: string;
  cancelacionTexto?: string;
  bookingUrl?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  /** Datos del negocio para el modal de reserva integrado. Si están presentes,
   * se muestra el botón principal "Reservar mesa" que abre el modal LPMBE. */
  negocioId?: number | null;
  negocioNombre?: string | null;
}

function whatsappLink(numero: string) {
  const limpio = numero.replace(/[^\d]/g, '');
  return `https://wa.me/${limpio}`;
}

export default function RestauranteReservaBanner({
  eyebrow,
  title,
  reservarOnlineLabel,
  llamarLabel,
  whatsappLabel,
  cancelacionTexto,
  bookingUrl,
  telefono,
  whatsapp,
  negocioId,
  negocioNombre,
}: Props) {
  const usarModal = !!(negocioId && negocioNombre);
  if (!usarModal && !bookingUrl && !telefono && !whatsapp) return null;

  return (
    <section className="py-16 md:py-24 bg-forest">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-4">
          {eyebrow}
        </p>
        <h2 className="font-serif text-3xl md:text-5xl text-white text-balance mb-10">{title}</h2>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {/* Botón principal — usa el modal LPMBE si tenemos los datos */}
          {usarModal ? (
            <ReservaButton
              negocioId={negocioId!}
              negocioNombre={negocioNombre!}
              tipoNegocio="RESTAURANTE"
              variant="gold"
              size="lg"
              label={reservarOnlineLabel}
              className="bg-gold text-foreground hover:bg-gold-dark"
              icon={<CalendarCheck className="size-4" />}
            />
          ) : (
            bookingUrl && (
              <Button
                asChild
                className="rounded-lg py-3 px-8 bg-gold text-foreground hover:bg-gold-dark font-semibold text-base gap-2 h-auto"
              >
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                  <CalendarCheck className="size-4" />
                  {reservarOnlineLabel}
                </a>
              </Button>
            )
          )}

          {telefono && (
            <Button
              variant="outline"
              asChild
              className="rounded-lg py-3 px-8 border-white/40 text-white bg-transparent hover:bg-white/10 hover:text-white hover:border-white/60 text-base gap-2 h-auto"
            >
              <a href={`tel:${telefono}`}>
                <Phone className="size-4" />
                {llamarLabel}
              </a>
            </Button>
          )}

          {whatsapp && (
            <Button
              variant="outline"
              asChild
              className="rounded-lg py-3 px-8 border-white/40 text-white bg-transparent hover:bg-white/10 hover:text-white hover:border-white/60 text-base gap-2 h-auto"
            >
              <a href={whatsappLink(whatsapp)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                {whatsappLabel}
              </a>
            </Button>
          )}
        </div>

        {cancelacionTexto && (
          <>
            <div className="w-16 h-px bg-white/20 mx-auto mb-4" />
            <p className="text-sm text-white/50">{cancelacionTexto}</p>
          </>
        )}
      </div>
    </section>
  );
}
