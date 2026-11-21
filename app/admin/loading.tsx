/** Esqueleto mostrado na hora ao trocar de tela no painel, enquanto os dados carregam. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <div className="mb-8 h-9 w-48 animate-pulse rounded-lg bg-white/5" />
      <div className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <div className="mt-8 h-80 animate-pulse rounded-2xl bg-white/[0.04]" />
    </div>
  );
}
