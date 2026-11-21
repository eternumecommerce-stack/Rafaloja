import Accordion from "@/components/Accordion";
import RichText from "@/components/RichText";
import Icon from "@/components/Icon";
import type { ProductPageData } from "@/lib/data";

/** Ícone de cada pergunta pelo assunto (entrega, rastreio, troca, defeito...) */
function faqIcon(question: string) {
  const q = question.toLowerCase();
  if (/deliver|shipping time/.test(q)) return "flight";
  if (/track/.test(q)) return "location_on";
  if (/return|refund|exchange/.test(q)) return "undo";
  if (/faulty|damaged|broken|defect/.test(q)) return "build";
  if (/size|fit/.test(q)) return "straighten";
  return "help";
}

export default function Faq({ faqs }: { faqs: ProductPageData["faqs"] }) {
  if (faqs.length === 0) return null;
  return (
    <section className="page-width pb-12 pt-4 md:pb-16">
      <div className="mx-auto max-w-[700px]">
        <h2 className="mb-5 text-center text-[22px] md:text-[24px]">FAQ</h2>
        <div className="border-t border-line">
          {faqs.map((f) => (
            <Accordion
              key={f.id}
              title={
                <span className="flex items-center gap-3">
                  <Icon name={faqIcon(f.question)} size={20} className="text-ink" />
                  {f.question}
                </span>
              }
              className="border-line"
              titleClassName="text-[15px] font-medium text-ink md:text-[16px]"
            >
              <RichText html={f.answerHtml} />
            </Accordion>
          ))}
        </div>
      </div>
    </section>
  );
}
