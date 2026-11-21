import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import SettingsManager from "@/components/admin/SettingsManager";
import { requireAdminPage } from "@/lib/admin";
import { db } from "@/lib/db";

async function AdminSettingsPageContent() {
  const me = await requireAdminPage();
  const announcements = await db.announcement.findMany({ orderBy: { position: "asc" } });
  return (
    <SettingsManager
      announcements={announcements.map((a) => ({ text: a.text, active: a.active }))}
      adminEmail={me.email}
    />
  );
}

// O conteúdo lê a sessão e o banco: fica dentro de Suspense para a navegação no painel ser instantânea
export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminSettingsPageContent />
    </Suspense>
  );
}
