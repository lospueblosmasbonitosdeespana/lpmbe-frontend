import Link from "next/link";
import { MegaMenu } from "./MegaMenu";
import AuthNavLink from "./AuthNavLink";

export function Header() {
  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-base font-semibold">
          LPBME
        </Link>

        <div className="hidden md:block">
          <MegaMenu />
        </div>

        <div className="flex items-center gap-4">
          <Link href="/contacto" className="text-sm font-medium hover:underline">
            Contacto
          </Link>
          <Link href="/mi-cuenta" className="text-sm font-medium hover:underline">
            Mi cuenta
          </Link>
          <AuthNavLink />
        </div>
      </div>
    </header>
  );
}

