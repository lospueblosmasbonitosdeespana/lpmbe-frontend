import { Card, CardContent, CardHeader } from '@/app/components/ui/card';
import {
  Users, Utensils, Leaf, WheatOff, MilkOff, Clock, Baby, PawPrint, Info, EggOff, Fish,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HorarioDia {
  diaSemana: number;
  abierto: boolean;
  horaAbre: string | null;
  horaCierra: string | null;
}

interface Props {
  eyebrow: string;
  title: string;
  aforo?: string | null;
  tipoServicio?: string | null;
  tiempoMedio?: string | null;
  politicaNinos?: string | null;
  politicaMascotas?: string | null;
  dietas?: string[];
  notaReserva?: string | null;
  horariosSemana?: HorarioDia[];
  hoursLabel: string;
  closedLabel: string;
  dietasLabel: string;
  noteLabel: string;
}

const DIET_LABELS: Record<string, { icon: LucideIcon; label: string }> = {
  VEGANO: { icon: Leaf, label: 'Vegano' },
  VEGETARIANO: { icon: Leaf, label: 'Vegetariano' },
  SIN_GLUTEN: { icon: WheatOff, label: 'Sin gluten' },
  SIN_LACTOSA: { icon: MilkOff, label: 'Sin lactosa' },
  SIN_HUEVO: { icon: EggOff, label: 'Sin huevo' },
  PESCETARIANO: { icon: Fish, label: 'Pescetariano' },
};

// Convención del schema: 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom
const DIA_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

function groupSchedule(horarios?: HorarioDia[]) {
  if (!horarios || horarios.length === 0) return [];
  const sorted = [...horarios]
    .filter((h) => Number.isInteger(h.diaSemana) && h.diaSemana >= 0 && h.diaSemana <= 6)
    .sort((a, b) => a.diaSemana - b.diaSemana);
  const groups: { dias: number[]; texto: string }[] = [];
  for (const h of sorted) {
    const texto = h.abierto && h.horaAbre && h.horaCierra ? `${h.horaAbre} – ${h.horaCierra}` : 'Cerrado';
    const last = groups[groups.length - 1];
    if (last && last.texto === texto) last.dias.push(h.diaSemana);
    else groups.push({ dias: [h.diaSemana], texto });
  }
  return groups.map((g) => {
    const first = DIA_NOMBRES[g.dias[0]];
    const last = DIA_NOMBRES[g.dias[g.dias.length - 1]];
    return { dias: g.dias.length === 1 ? first : `${first} – ${last}`, texto: g.texto };
  });
}

export default function RestauranteInfoPractica({
  eyebrow,
  title,
  aforo,
  tipoServicio,
  tiempoMedio,
  politicaNinos,
  politicaMascotas,
  dietas,
  notaReserva,
  horariosSemana,
  hoursLabel,
  closedLabel,
  dietasLabel,
  noteLabel,
}: Props) {
  const grouped = groupSchedule(horariosSemana);

  return (
    <section className="py-16 md:py-24 bg-muted/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground text-balance">{title}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {aforo && <DetailRow icon={Users} label="Aforo" value={aforo} />}
            {tipoServicio && <DetailRow icon={Utensils} label="Tipo de servicio" value={tipoServicio} />}
            {tiempoMedio && (
              <DetailRow icon={Clock} label="Tiempo medio de servicio" value={tiempoMedio} />
            )}
            {politicaNinos && <DetailRow icon={Baby} label="Niños" value={politicaNinos} />}
            {politicaMascotas && (
              <DetailRow icon={PawPrint} label="Mascotas" value={politicaMascotas} />
            )}

            {dietas && dietas.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-3">
                  {dietasLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {dietas.map((key) => {
                    const cfg = DIET_LABELS[key];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-sm text-foreground"
                      >
                        <Icon className="size-3.5 text-gold" />
                        {cfg.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {grouped.length > 0 && (
              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold">
                    {hoursLabel}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {grouped.map((g, i) => (
                    <div
                      key={`${g.dias}-${i}`}
                      className="flex justify-between items-baseline border-b border-border/60 pb-3 last:border-0 last:pb-0 gap-4"
                    >
                      <span className="text-sm text-foreground">{g.dias}</span>
                      <span
                        className={`text-sm font-semibold text-right ${
                          g.texto === 'Cerrado' ? 'text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {g.texto === 'Cerrado' ? closedLabel : g.texto}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {notaReserva && (
              <div className="flex gap-3 rounded-xl bg-amber-50/60 border border-amber-200/60 p-4">
                <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  <span className="font-semibold">{noteLabel}:</span> {notaReserva}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-4 text-gold" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.12em] mb-0.5">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
