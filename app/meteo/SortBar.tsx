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

type SortOption = {
  key: SortMode;
  label: string;
  Icon: React.ComponentType<{ size: number; className?: string }>;
};

const OPTIONS: SortOption[] = [
  { key: "temp_asc", label: "Más frío", Icon: ThermometerSnowflake },
  { key: "temp_desc", label: "Más calor", Icon: ThermometerSun },
  { key: "alpha", label: "A → Z", Icon: ArrowDownAZ },
  { key: "rain_desc", label: "Más lluvia", Icon: CloudRain },
  { key: "wind_desc", label: "Más viento", Icon: Wind },
  { key: "aqi_asc", label: "Aire limpio", Icon: Leaf },
];

export function SortBar({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setSort = (key: SortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {OPTIONS.map(({ key, label, Icon }) => {
        const active = currentSort === key;
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
