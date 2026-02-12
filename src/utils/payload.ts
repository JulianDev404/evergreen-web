// apps/web/src/utils/payload.ts
import type { SerializedEditorState } from "lexical";
const API_URL = import.meta.env.PUBLIC_API_URL;

// ============================================================================
// CONFIGURACIÓN DE ESTILOS PERSONALIZABLES
// ============================================================================

export interface TextStyleConfig {
  bold?: string;
  italic?: string;
  underline?: string;
  code?: string;
  paragraph?: string;
  headings?: {
    h1?: string;
    h2?: string;
    h3?: string;
    h4?: string;
    h5?: string;
    h6?: string;
  };
  list?: {
    ul?: string;
    ol?: string;
    li?: string;
  };
  link?: string;
  quote?: string;
}

// Estilos por defecto (tema oscuro/verde)
const DEFAULT_DARK_STYLES: TextStyleConfig = {
  bold: "text-evergreen-primary font-semibold",
  italic: "italic",
  underline: "underline",
  code: "bg-neutral-100 px-2 py-1 rounded",
  paragraph: "text-base leading-relaxed mb-4",
  headings: {
    h1: "text-5xl text-white mt-8 mb-4",
    h2: "text-6xl text-white mt-8 mb-4",
    h3: "text-3xl text-white mb-3",
    h4: "text-xl text-white mb-2",
    h5: "text-base text-white mb-2",
    h6: "text-sm text-white mb-2",
  },
  list: {
    ul: "list-disc list-inside space-y-2 mb-4 ml-4 text-neutral-200",
    ol: "list-decimal list-inside space-y-2 mb-4 ml-4 text-neutral-200",
    li: "text-neutral-200",
  },
  link: "text-evergreen-primary font-semibold no-underline hover:underline",
  quote:
    "border-l-4 border-evergreen-primary pl-4 italic text-neutral-600 my-4",
};

// Estilos para tema claro
const LIGHT_STYLES: TextStyleConfig = {
  bold: "text-neutral-900 font-bold",
  italic: "italic",
  underline: "underline",
  code: "bg-neutral-200 px-2 py-1 rounded text-sm font-mono",
  paragraph: "text-neutral-50 text-lg leading-relaxed mb-4",
  headings: {
    h1: "text-6xl font-bold text-neutral-900 mt-8 mb-4",
    h2: "text-3xl font-bold text-neutral-900 mt-6 mb-3",
    h3: "text-2xl font-semibold text-neutral-50 mb-3",
    h4: "text-xl font-semibold text-neutral-50 mb-2",
    h5: "text-lg font-medium text-neutral-700 mb-2",
    h6: "text-base font-medium text-neutral-700 mb-2",
  },
  list: {
    ul: "list-disc list-inside space-y-2 mb-4 ml-4 text-neutral-700",
    ol: "list-decimal list-inside space-y-2 mb-4 ml-4 text-neutral-700",
    li: "text-neutral-700",
  },
  link: "text-blue-600 underline hover:text-blue-800",
  quote:
    "border-l-4 border-blue-500 pl-4 italic text-neutral-600 my-4 bg-neutral-50 py-2",
};

// Estilos para servicios/marketing
const SERVICE_STYLES: TextStyleConfig = {
  bold: "text-evergreen-primary font-bold",
  paragraph: "text-neutral-700 text-base leading-relaxed mb-4",
  headings: {
    h2: "text-3xl font-bold text-evergreen-primary mb-4",
    h3: "text-2xl font-semibold text-neutral-900 mb-3",
  },
  list: {
    ul: "space-y-3 mb-6",
    li: "flex items-start gap-2 text-neutral-700 before:content-['✓'] before:text-evergreen-primary before:font-bold before:mr-2",
  },
};

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

export function processMarkdown(
  content: any,
  styleConfig: TextStyleConfig = DEFAULT_DARK_STYLES,
): string {
  if (!content) return "";

  // Si es un string simple, procesarlo directamente
  if (typeof content === "string") {
    const boldClass = styleConfig.bold || DEFAULT_DARK_STYLES.bold;
    return content.replace(
      /\*\*(.*?)\*\*/g,
      `<strong class="${boldClass}">$1</strong>`,
    );
  }

  // Si es richText de Payload (objeto con root)
  if (content.root && content.root.children) {
    return convertLexicalToHTML(content, styleConfig);
  }

  return "";
}

// Convertir el formato Lexical (richText de Payload) a HTML
function convertLexicalToHTML(
  editorState: any,
  styleConfig: TextStyleConfig,
): string {
  if (!editorState || !editorState.root) return "";

  const { children } = editorState.root;
  return children
    .map((node: any) => convertNodeToHTML(node, styleConfig))
    .join("");
}

function convertNodeToHTML(node: any, styleConfig: TextStyleConfig): string {
  const { type, children, text, format, tag } = node;

  // Nodo de texto
  if (type === "text") {
    let html = text || "";

    // Aplicar formatos
    if (format) {
      if (format & 1)
        html = `<strong class="${styleConfig.bold || DEFAULT_DARK_STYLES.bold}">${html}</strong>`;
      if (format & 2)
        html = `<em class="${styleConfig.italic || DEFAULT_DARK_STYLES.italic}">${html}</em>`;
      if (format & 8)
        html = `<code class="${styleConfig.code || DEFAULT_DARK_STYLES.code}">${html}</code>`;
      if (format & 16)
        html = `<u class="${styleConfig.underline || DEFAULT_DARK_STYLES.underline}">${html}</u>`;
    }

    return html;
  }

  // Párrafo
  if (type === "paragraph") {
    const content =
      children
        ?.map((child: any) => convertNodeToHTML(child, styleConfig))
        .join("") || "";
    return `<p class="${styleConfig.paragraph || DEFAULT_DARK_STYLES.paragraph}">${content}</p>`;
  }

  // Heading
  if (type === "heading") {
    const level = tag || "h2";
    const content =
      children
        ?.map((child: any) => convertNodeToHTML(child, styleConfig))
        .join("") || "";

    const headingClass =
      styleConfig.headings?.[level as keyof typeof styleConfig.headings] ||
      DEFAULT_DARK_STYLES.headings?.[
        level as keyof typeof DEFAULT_DARK_STYLES.headings
      ] ||
      "";

    return `<${level} class="${headingClass}">${content}</${level}>`;
  }

  // Lista
  if (type === "list") {
    const listTag = node.listType === "number" ? "ol" : "ul";
    const content =
      children
        ?.map((child: any) => convertNodeToHTML(child, styleConfig))
        .join("") || "";
    const listClass =
      listTag === "ol"
        ? styleConfig.list?.ol || DEFAULT_DARK_STYLES.list?.ol
        : styleConfig.list?.ul || DEFAULT_DARK_STYLES.list?.ul;
    return `<${listTag} class="${listClass}">${content}</${listTag}>`;
  }

  // Item de lista
  if (type === "listitem") {
    const content =
      children
        ?.map((child: any) => convertNodeToHTML(child, styleConfig))
        .join("") || "";
    return `<li class="${styleConfig.list?.li || DEFAULT_DARK_STYLES.list?.li}">${content}</li>`;
  }

  // Link
  if (type === "link") {
    const href = node.fields?.url || node.url || "#";
    const content =
      children
        ?.map((child: any) => convertNodeToHTML(child, styleConfig))
        .join("") || "";
    return `<a href="${href}" class="${styleConfig.link || DEFAULT_DARK_STYLES.link}">${content}</a>`;
  }

  // Quote
  if (type === "quote") {
    const content =
      children
        ?.map((child: any) => convertNodeToHTML(child, styleConfig))
        .join("") || "";
    return `<blockquote class="${styleConfig.quote || DEFAULT_DARK_STYLES.quote}">${content}</blockquote>`;
  }

  // Line break
  if (type === "linebreak") {
    return "<br>";
  }

  // Default: procesar children si existen
  if (children) {
    return children
      .map((child: any) => convertNodeToHTML(child, styleConfig))
      .join("");
  }

  return "";
}

// ============================================================================
// HELPERS Y EXPORTS
// ============================================================================

// Exportar estilos predefinidos
export const TEXT_STYLES = {
  dark: DEFAULT_DARK_STYLES,
  light: LIGHT_STYLES,
  service: SERVICE_STYLES,
};

// Exportar una versión simplificada para backward compatibility
export function processSimpleMarkdown(text: string | undefined): string {
  if (!text) return "";
  return text.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="text-evergreen-primary font-semibold">$1</strong>',
  );
}

export function getImageUrl(image: any): string {
  // if (!image) return "";

  // if (typeof image === "string") {
  //   if (image.startsWith("http")) return image;
  //   return `${API_URL}${image}`;
  // }

  // if (image.url) {
  //   if (image.url.startsWith("http")) return image.url;
  //   if (image.url.startsWith("/api/")) {
  //     return `${API_URL}${image.url}`;
  //   }
  //   return `${API_URL}${image.url.startsWith("/") ? "" : "/"}${image.url}`;
  // }
  // console.log(image.url);
  return image.url;
}

export function formatPhoneLink(phone: string): string {
  return `tel:${phone.replace(/\D/g, "")}`;
}
