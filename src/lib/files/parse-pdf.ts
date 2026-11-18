import { MAX_PDF_PAGES } from "./constants";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfModulePromise: Promise<PdfJsModule> | null = null;

async function getPdfJs(): Promise<PdfJsModule> {
  if (!pdfModulePromise) {
    pdfModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs") as Promise<PdfJsModule>;
  }
  return pdfModulePromise;
}

export async function parsePdfBuffer(buffer: Buffer, fileName: string) {
  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const warnings: string[] = [];
  const pageCount = pdf.numPages;
  const pagesToRead = Math.min(pageCount, MAX_PDF_PAGES);

  if (pageCount > MAX_PDF_PAGES) {
    warnings.push(
      `Text extracted from first ${MAX_PDF_PAGES} of ${pageCount} pages only.`,
    );
  }

  const chunks: string[] = [`PDF file: ${fileName}`, `Pages: ${pageCount}`];

  for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => {
        if (!("str" in item)) return "";
        return String(item.str ?? "");
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (text) {
      chunks.push(`\n[Page ${pageNumber}]`, text);
    }
  }

  const extracted = chunks.join("\n");
  const meaningfulChars = extracted.replace(/\s+/g, "").length;
  if (meaningfulChars < 40) {
    warnings.push(
      "Very little text was extracted. The PDF may be scanned, image-based, or empty.",
    );
    warnings.push(
      "Verified sales metrics require tabular CSV or Excel uploads; PDF text is context only.",
    );
  }

  const summary = `${fileName}: ${pageCount} page(s), ${pagesToRead} page(s) parsed`;

  return {
    contextText: extracted,
    summary,
    warnings,
    pageCount,
    tabularDatasets: [],
  };
}