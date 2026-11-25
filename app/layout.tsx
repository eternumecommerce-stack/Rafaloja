import type { Metadata, Viewport } from "next";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import MetaPixel from "@/components/MetaPixel";
import { brand } from "@/lib/store";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Títulos do rodapé
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s – ${brand.name}` },
  description: brand.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2d5b8f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${lora.variable} antialiased`}>
      <head>
        {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font -- icon font: block avoids flashing ligature names */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="min-h-full">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
        <MetaPixel />
      </body>
    </html>
  );
}
