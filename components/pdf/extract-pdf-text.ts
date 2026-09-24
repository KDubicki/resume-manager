// Client-only: reads the text layer back out of the PDF blob the live preview
// just rendered — the same bytes the export streams — using pdf.js. Lines come
// out in content-stream order, the order many ATS parsers consume them in.
//
// pdf.js (~1 MB) is imported on first use only, so it never weighs on the
// editor's initial load, and it never enters the serverless export bundle.

type PdfJs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjs) => {
    // One module worker for the whole session. `new Worker(new URL(...))` is
    // the pattern both Turbopack and webpack bundle natively, so the worker
    // ships with the app instead of being copied into /public by hand.
    if (!pdfjs.GlobalWorkerOptions.workerPort) {
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(
        new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
        { type: "module" },
      );
    }
    return pdfjs;
  });
  return pdfjsPromise;
}

/** Each page's text lines, in extraction order. */
export async function extractPdfLines(blob: Blob): Promise<string[][]> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
  const document = await task.promise;
  try {
    const pages: string[][] = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const { items } = await page.getTextContent();
      const lines: string[] = [];
      let current = "";
      for (const item of items) {
        // Marked-content entries carry no text.
        if (!("str" in item)) continue;
        current += item.str;
        if (item.hasEOL) {
          lines.push(current);
          current = "";
        }
      }
      if (current) lines.push(current);
      pages.push(lines);
    }
    return pages;
  } finally {
    // Frees this document only; the shared worker port stays alive.
    await task.destroy();
  }
}
