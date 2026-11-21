import "server-only";
import sanitizeHtml from "sanitize-html";

// Só formatação simples de texto. Sem script, style, iframe, eventos (onclick...) ou javascript: em links.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "span"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    // Links externos sempre com rel seguro
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

/** Renderiza HTML vindo do banco já sanitizado (defesa contra XSS armazenado). */
export default function RichText({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  return <div className={`rte ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html, OPTIONS) }} />;
}
