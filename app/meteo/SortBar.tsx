"use client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ThermometerSnowflake,
  ThermometerSun,
  ArrowDownAZ,
  CloudRain,
  Wind,
  Leaf,
} from "lucide-react";

type SortMode = "temp_asc" | "temp_desc" | "alpha" | "rain_desc" | "wind_desc" | "aqi_asc";

const ICONS: Record<SortMode, React.ComponentType<{ size: number; className?: string }>> = {
  temp_asc: ThermometerSnowflake,
  temp_desc: ThermometerSun,
  alpha: ArrowDownAZ,
  rain_desc: CloudRain,
  wind_desc: Wind,
  aqi_asc: Leaf,
};

const SORT_KEYS: SortMode[] = ["temp_asc", "temp_desc", "alpha", "rain_desc", "wind_desc", "aqi_asc"];

const FALLBACK_LABELS: Record<SortMode, string> = {
  temp_asc: "Más frío",
  temp_desc: "Más calor",
  alpha: "A → Z",
  rain_desc: "Más lluvia",
  wind_desc: "Más viento",
  aqi_asc: "Aire limpio",
};

export function SortBar({
  currentSort,
  labels,
}: {
  currentSort: string;
  labels?: Record<SortMode, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setSort = (key: SortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {SORT_KEYS.map((key) => {
        const active = currentSort === key;
        const Icon = ICONS[key];
        const label = labels?.[key] ?? FALLBACK_LABELS[key];
        return (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              active
                ? "bg-[#994920] text-white border-[#994920]"
                : "bg-[#efe2d8] text-[#60524d] border-[#e2d5cb] hover:bg-[#e2d5cb]"
            }`}
          >
            <Icon size={14} className={active ? "text-white" : "text-[#60524d]"} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
