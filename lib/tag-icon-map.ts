import {
  Landmark, MountainSnow, Waves, TowerControl, FerrisWheel, Palmtree,
  Caravan, PlugZap, Heart, Snowflake, Thermometer, Sun, Activity,
  Shield, ShieldHalf, Church, Building, Building2, Crown, LayoutGrid,
  Theater, Lock, Route, Droplets, Circle, Columns, Home, User, Cross,
  Pickaxe, Gem, Award, Globe, Eye, TreePine, CircleDot, Flower2,
  Wine, Flame, PartyPopper, Grape, GlassWater, Store, Paintbrush,
  Star, Film, Footprints, Accessibility, Laptop, Tent, Mountain,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps tag icon names (from DB / seed) to Lucide components.
 * Also includes collection-level icons for backward compat.
 */
export const TAG_ICON_MAP: Record<string, LucideIcon> = {
  // Patrimonio militar
  castle: Landmark,
  shield: Shield,
  "shield-half": ShieldHalf,
  "tower-control": TowerControl,

  // Patrimonio religioso
  church: Church,
  building: Building,
  "building-2": Building2,

  // Patrimonio civil
  crown: Crown,
  "layout-grid": LayoutGrid,
  theater: Theater,
  lock: Lock,
  route: Route,
  droplets: Droplets,
  circle: Circle,
  columns: Columns,
  home: Home,
  user: User,
  cross: Cross,

  // Patrimonio arqueológico
  pickaxe: Pickaxe,
  gem: Gem,
  award: Award,
  globe: Globe,

  // Naturaleza
  waves: Waves,
  mountain: Mountain,
  "mountain-snow": MountainSnow,
  eye: Eye,
  "tree-pine": TreePine,
  "circle-dot": CircleDot,
  "flower-2": Flower2,
  thermometer: Thermometer,
  snowflake: Snowflake,

  // Gastronomía
  wine: Wine,
  landmark: Landmark,
  flame: Flame,
  "party-popper": PartyPopper,
  grape: Grape,
  "glass-water": GlassWater,
  store: Store,
  paintbrush: Paintbrush,

  // Atmósfera
  sun: Sun,
  star: Star,
  film: Film,
  footprints: Footprints,

  // Accesibilidad
  accessibility: Accessibility,
  laptop: Laptop,
  tent: Tent,

  // Collection-level icons (backward compat)
  "brick-wall": TowerControl,
  "ferris-wheel": FerrisWheel,
  palmtree: Palmtree,
  caravan: Caravan,
  "plug-zap": PlugZap,
  zap: PlugZap,
  users: Heart,
  heart: Heart,
  wind: Thermometer,
};

const EMOJI_TO_ICON: Record<string, LucideIcon> = {
  "🏰": Landmark,
  "⛰️": MountainSnow,
  "🌊": Waves,
  "🧱": TowerControl,
  "🏘️": FerrisWheel,
  "🏝️": Palmtree,
  "🚐": Caravan,
  "⚡": PlugZap,
  "👨‍👩‍👧‍👦": Heart,
  "❄️": Snowflake,
  "🌬️": Thermometer,
  "☀️": Sun,
};

export function resolveTagIcon(name: string): LucideIcon {
  return TAG_ICON_MAP[name] ?? EMOJI_TO_ICON[name] ?? Activity;
}

export function TagIcon({
  name,
  color,
  size = 16,
  className,
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  const Icon = resolveTagIcon(name);
  return (
    <Icon
      size={size}
      style={color ? { color } : undefined}
      className={className}
      strokeWidth={1.75}
    />
  );
}
