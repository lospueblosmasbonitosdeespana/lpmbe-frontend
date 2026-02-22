"use client";
import { useRouter, useSearchParams } from "next/navigation";

type SortMode = "temp_asc" | "temp_desc" | "alpha" | "rain_desc" | "wind_desc" | "aqi_asc";

const OPTIONS: { key: SortMode; label: string; emoji: string }[] = [
  { key: "temp_asc", label: "Más frío", emoji: "🥶" },
  { key: "temp_desc", label: "Más calor", emoji: "🌡️" },
  { key: "alpha", label: "A → Z", emoji: "🔤" },
  { key: "rain_desc", label: "Más lluvia", emoji: "🌧️" },
  { key: "wind_desc", label: "Más viento", emoji: "💨" },
  { key: "aqi_asc", label: "Aire limpio", emoji: "🍃" },
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
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => setSort(opt.key)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            currentSort === opt.key
              ? "bg-[#994920] text-white border-[#994920]"
              : "bg-[#efe2d8] text-[#60524d] border-[#e2d5cb] hover:bg-[#e2d5cb]"
          }`}
        >
          <span>{opt.emoji}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
