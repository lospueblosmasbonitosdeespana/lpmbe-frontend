import {
  Landmark, MountainSnow, Waves, TowerControl, FerrisWheel, Palmtree,
  Caravan, PlugZap, Heart, Snowflake, Thermometer, Sun, Activity,
  Shield, ShieldHalf, ShieldAlert, ShieldCheck, Church, Building, Building2,
  Crown, LayoutGrid, Theater, Lock, Route, Droplets, Droplet, Circle,
  Columns, Home, User, Cross, Pickaxe, Gem, Award, Globe, Globe2, Eye,
  TreePine, CircleDot, Flower2, Wine, Flame, PartyPopper, Grape,
  GlassWater, Store, Paintbrush, Star, Film, Footprints, Accessibility,
  Laptop, Tent, Mountain, BrickWall, Sparkle, Hexagon, Pentagon, Diamond,
  Scroll, Trophy, Medal, Milestone, Amphora, BookOpen, Clapperboard,
  Siren, Compass, Castle, SprayCan,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps tag icon names (from DB / seed) to Lucide components.
 * Also includes collection-level icons for backward compat.
 */
export const TAG_ICON_MAP: Record<string, LucideIcon> = {
  // Patrimonio militar
  castle: Landmark,
  "castle-icon": Castle,
  shield: Shield,
  "shield-half": ShieldHalf,
  "shield-alert": ShieldAlert,
  "shield-check": ShieldCheck,
  "tower-control": TowerControl,
  siren: Siren,

  // Patrimonio religioso
  church: Church,
  compass: Compass,
  building: Building,
  "building-2": Building2,

  // Patrimonio civil
  crown: Crown,
  "book-open": BookOpen,
  "layout-grid": LayoutGrid,
  theater: Theater,
  clapperboard: Clapperboard,
  lock: Lock,
  route: Route,
  milestone: Milestone,
  droplets: Droplets,
  droplet: Droplet,
  "spray-can": SprayCan,
  circle: Circle,
  columns: Columns,
  amphora: Amphora,
  home: Home,
  user: User,
  cross: Cross,

  // Patrimonio arqueológico / estilos artísticos
  pickaxe: Pickaxe,
  gem: Gem,
  sparkle: Sparkle,
  hexagon: Hexagon,
  pentagon: Pentagon,
  diamond: Diamond,
  award: Award,
  globe: Globe,
  "globe-2": Globe2,

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
  trophy: Trophy,
  medal: Medal,
  grape: Grape,
  "glass-water": GlassWater,
  store: Store,
  paintbrush: Paintbrush,

  // Atmósfera
  sun: Sun,
  star: Star,
  scroll: Scroll,
  film: Film,
  footprints: Footprints,
  "brick-wall": BrickWall,

  // Accesibilidad
  accessibility: Accessibility,
  laptop: Laptop,
  tent: Tent,

  // Collection-level icons (backward compat)
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
