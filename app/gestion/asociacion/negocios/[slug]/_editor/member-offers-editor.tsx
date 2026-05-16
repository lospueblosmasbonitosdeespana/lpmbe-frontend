'use client'

import { Input } from '@/app/components/ui/input'
import { Switch } from '@/app/components/ui/switch'
import { Crown } from 'lucide-react'
import {
  Field, SectionHeader, CountedTextarea, AddButton,
  RemoveButton, DragHandle, IconSelect, OFFER_ICONS, EmptyHint,
} from './editor-primitives'
import type { MemberOffersConfig, MemberOffer } from './landing-config'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Separator } from '@/app/components/ui/separator'
import { Card } from '@/app/components/ui/card'

function countFilled(cfg: MemberOffersConfig): number {
  return [cfg.eyebrow, cfg.title, ...cfg.offers.map((o) => o.title)].filter(Boolean).length
}

export function MemberOffersEditor({
  value,
  onChange,
}: {
  value: MemberOffersConfig
  onChange: (v: MemberOffersConfig) => void
}) {
  function updateOffer(id: string, patch: Partial<MemberOffer>) {
    onChange({
      ...value,
      offers: value.offers.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })
  }

  function removeOffer(id: string) {
    if (value.offers.length <= 1) return
    onChange({ ...value, offers: value.offers.filter((o) => o.id !== id) })
  }

  function addOffer() {
    if (value.offers.length >= 6) return
    const newOffer: MemberOffer = {
      id: `o${Date.now()}`,
      icon: 'gift',
      title: '',
      description: '',
      highlight: '',
      isFeatured: false,
      badgeText: '',
    }
    onChange({ ...value, offers: [...value.offers, newOffer] })
  }

  return (
    <AccordionItem value="memberOffers" className="border border-border rounded-xl overflow-hidden bg-white">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:bg-muted/20">
        <SectionHeader
          icon={<Crown className="size-4" />}
          title="Ofertas para socios LPMBE"
          filled={countFilled(value)}
          total={2 + value.offers.length}
          open={false}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-2 space-y-5">
        <p className="text-[11px] text-muted-foreground">
          Beneficios exclusivos para miembros del club. Aparecen en una sección destacada de la página pública.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Antetítulo (texto pequeño sobre el título)">
            <Input
              value={value.eyebrow}
              onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
              placeholder="Ventajas socios Club LPMBE"
              className="text-sm"
            />
          </Field>
          <Field label="Título de sección">
            <Input
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="Ofertas exclusivas"
              className="text-sm"
            />
          </Field>
        </div>

        <Separator />

        <div className="space-y-3">
          {value.offers.length === 0 && (
            <EmptyHint>Añade las ventajas exclusivas que ofreces a los socios del club: descuentos, acceso preferente, regalos de bienvenida...</EmptyHint>
          )}
          {value.offers.map((offer, idx) => (
            <Card key={offer.id} className="p-4 space-y-3 border border-border bg-muted/10">
              <div className="flex items-center gap-2">
                <DragHandle />
                <span className="text-xs font-medium text-muted-foreground flex-1">
                  Oferta {idx + 1}
                </span>
                <RemoveButton onClick={() => removeOffer(offer.id)} label="Eliminar oferta" />
              </div>

              <div className="grid sm:grid-cols-[140px_1fr] gap-3">
                <Field label="Icono">
                  <IconSelect
                    value={offer.icon}
                    onChange={(v) => updateOffer(offer.id, { icon: v as MemberOffer['icon'] })}
                    options={OFFER_ICONS}
                  />
                </Field>
                <Field label="Título">
                  <Input
                    value={offer.title}
                    onChange={(e) => updateOffer(offer.id, { title: e.target.value })}
                    placeholder="Copa de cava de bienvenida"
                    className="h-8 text-sm"
                  />
                </Field>
              </div>

              <Field label="Descripción (máx. 200 caracteres)">
                <CountedTextarea
                  value={offer.description}
                  onChange={(v) => updateOffer(offer.id, { description: v })}
                  maxLength={200}
                  rows={2}
                  placeholder="Recibe a tu llegada una copa de cava artesano..."
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Texto destacado (precio / valor)">
                  <Input
                    value={offer.highlight}
                    onChange={(e) => updateOffer(offer.id, { highlight: e.target.value })}
                    placeholder="Gratis · −10% · Bajo reserva"
                    className="h-8 text-sm"
                  />
                </Field>
                <div className="flex items-end gap-3 pb-0.5">
                  <div className="flex items-center gap-2 flex-1 rounded-lg border border-border bg-white px-3 py-2">
                    <Switch
                      id={`featured-${offer.id}`}
                      checked={offer.isFeatured}
                      onCheckedChange={(v) => updateOffer(offer.id, { isFeatured: v })}
                    />
                    <label htmlFor={`featured-${offer.id}`} className="text-xs cursor-pointer text-muted-foreground">
                      Destacada
                    </label>
                  </div>
                  {offer.isFeatured && (
                    <Input
                      value={offer.badgeText}
                      onChange={(e) => updateOffer(offer.id, { badgeText: e.target.value })}
                      placeholder="Badge texto"
                      className="h-9 text-xs w-28 shrink-0"
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
          <AddButton
            onClick={addOffer}
            label="Añadir oferta"
            disabled={value.offers.length >= 6}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
