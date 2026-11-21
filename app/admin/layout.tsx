import type { Metadata } from "next";
import { Suspense } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminPage } from "@/lib/admin";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-theme min-h-dvh bg-[#0f0e12] text-white">
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center">
            <span className="size-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
          </div>
        }
      >
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const newMessages = await db.contactMessage.count({ where: { status: "NEW" } });
  return (
    <div className="md:flex">
      <AdminSidebar admin={{ name: admin.name, email: admin.email }} newMessages={newMessages} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
