'use client'

import { TextField, TextareaField, SwitchField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from './AdminField'
import type { LodgingLandingConfig, OfferIcon } from './lodging-types'

const ICON_OPTIONS: { value: OfferIcon; label: string }[] = [
  { value: 'gift',     label: 'Regalo' },
  { value: 'percent',  label: 'Descuento (%)' },
  { value: 'sparkles', label: 'Destellos (experiencia)' },
  { value: 'crown',    label: 'Corona (premium)' },
  { value: 'wine',     label: 'Vino' },
  { value: 'star',     label: 'Estrella' },
]

interface Props {
  value: LodgingLandingConfig['memberOffers']
  onChange: (v: LodgingLandingConfig['memberOffers']) => void
}

export function MemberOffersEditor({ value, onChange }: Props) {
  const set = (patch: Partial<LodgingLandingConfig['memberOffers']>) => onChange({ ...value, ...patch })

  const updateOffer = (id: string, patch: Partial<LodgingLandingConfig['memberOffers']['offers'][0]>) =>
    set({ offers: value.offers.map(o => o.id === id ? { ...o, ...patch } : o) })

  const removeOffer = (id: string) =>
    set({ offers: value.offers.filter(o => o.id !== id) })

  const addOffer = () => {
    if (value.offers.length >= 6) return
    set({
      offers: [
        ...value.offers,
        {
          id: `mo${Date.now()}`,
          icon: 'gift',
          badge: 'Nuevo',
          title: 'Nueva oferta',
          description: '',
          conditions: '',
          isFeatured: false,
        },
      ],
    })
  }

  return (
    <div className="space-y-5">
      <EditorGrid cols={2}>
        <TextField
          label="Subtítulo (eyebrow)"
          value={value.eyebrow}
          onChange={v => set({ eyebrow: v })}
          placeholder="Exclusivo Club LPMBE"
        />
        <TextField
          label="Título de la sección"
          value={value.title}
          onChange={v => set({ title: v })}
          placeholder="Ventajas exclusivas para socios"
        />
      </EditorGrid>

      <SectionLabel>Ofertas para socios (máx. 6)</SectionLabel>
      <div className="space-y-4">
        {value.offers.map(offer => (
          <ListItemRow key={offer.id} onDelete={() => removeOffer(offer.id)} canDelete={value.offers.length > 1}>
            <div className="space-y-3">
              <EditorGrid cols={3}>
                <SelectField
                  label="Icono"
                  value={offer.icon}
                  onChange={v => updateOffer(offer.id, { icon: v as OfferIcon })}
                  options={ICON_OPTIONS}
                />
                <TextField
                  label="Etiqueta (badge)"
                  value={offer.badge}
                  onChange={v => updateOffer(offer.id, { badge: v })}
                  placeholder="Regalo"
                />
                <SwitchField
                  label="Destacado (fondo de color)"
                  checked={offer.isFeatured}
                  onChange={v => updateOffer(offer.id, { isFeatured: v })}
                />
              </EditorGrid>
              <TextField
                label="Título de la oferta"
                value={offer.title}
                onChange={v => updateOffer(offer.id, { title: v })}
                placeholder="Bienvenida especial Club LPMBE"
              />
              <TextareaField
                label="Descripción"
                value={offer.description}
                onChange={v => updateOffer(offer.id, { description: v })}
                rows={2}
              />
              <TextField
                label="Condiciones"
                hint="Texto en cursiva al pie de la tarjeta"
                value={offer.conditions}
                onChange={v => updateOffer(offer.id, { conditions: v })}
                placeholder="Válido para reservas directas. Sujeto a disponibilidad."
              />
            </div>
          </ListItemRow>
        ))}
      </div>
      <AddButton label="Añadir oferta" onClick={addOffer} disabled={value.offers.length >= 6} />
    </div>
  )
}
