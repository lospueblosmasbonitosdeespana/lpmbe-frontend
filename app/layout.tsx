import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LPBME 2.0",
  description: "Los Pueblos Más Bonitos de España",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
