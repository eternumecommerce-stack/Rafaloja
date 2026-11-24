/** Faixa azul do topo: os avisos rolam em loop contínuo, da direita para a esquerda. */
export default function AnnouncementBar({ announcements }: { announcements: string[] }) {
  // Repete a lista até preencher bem a tela; a segunda metade é cópia para o loop não "pular"
  const row = Array.from({ length: 4 }, () => announcements).flat();

  return (
    <div className="overflow-hidden bg-brand text-white" role="region" aria-label="Announcement">
      <p className="sr-only">{announcements.join(" · ")}</p>
      <div className="animate-ticker flex w-max " aria-hidden="true">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0">
            {row.map((text, i) => (
              <li key={i} className="whitespace-nowrap px-6 text-[8px] md:text-[12px] font-medium uppercase leading-[22px] tracking-[0.6px] md:px-[30px] md:py-[10px]">
                {text}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
