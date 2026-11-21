import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import MessagesManager from "@/components/admin/MessagesManager";
import { requireAdminPage } from "@/lib/admin";
import { db } from "@/lib/db";

async function AdminMessagesPageContent() {
  await requireAdminPage();
  const [messages, subscribers] = await Promise.all([
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <MessagesManager
      messages={messages.map((m) => ({ id: m.id, name: m.name, email: m.email, phone: m.phone, message: m.message, status: m.status, createdAt: m.createdAt.toISOString() }))}
      subscribers={subscribers.map((s) => ({ id: s.id, email: s.email, source: s.source, createdAt: s.createdAt.toISOString() }))}
    />
  );
}

// O conteúdo lê a sessão e o banco: fica dentro de Suspense para a navegação no painel ser instantânea
export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminMessagesPageContent />
    </Suspense>
  );
}
