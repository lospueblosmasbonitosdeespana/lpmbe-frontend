import type { Metadata } from "next";
import { seoTitle, seoDescription } from "@/lib/seo";
import { CandidaturaForm } from "./CandidaturaForm";

export const metadata: Metadata = {
  title: seoTitle("Candidatura Selection | Club LPMBE"),
  description: seoDescription(
    "Presenta la candidatura de tu establecimiento para formar parte del programa Club LPMBE Selection."
  ),
  robots: { index: true, follow: true },
};

export default function CandidaturaPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Candidatura Club LPMBE Selection
          </h1>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto">
            Cuéntanos sobre tu establecimiento. Evaluaremos tu candidatura
            y nos pondremos en contacto contigo.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <CandidaturaForm />
      </div>
    </main>
  );
}
