import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { getAnnouncements } from "@/lib/data";

/** Casca da loja (home e produto): barra de anúncios, header, rodapé. O checkout tem layout próprio. */
export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const announcements = await getAnnouncements();

  return (
    <>
      {announcements.length > 0 && <AnnouncementBar announcements={announcements} />}
      <Header />
      <main>{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
