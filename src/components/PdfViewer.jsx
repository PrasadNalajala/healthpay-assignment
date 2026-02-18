import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Use the library's pdfjs version for the worker to avoid mismatches
const workerVersion = pdfjs?.version || "2.16.105";
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.min.js`;

export default function PdfViewer({ page = 1, onChangePage }) {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.1);
  const [pdfAvailable, setPdfAvailable] = useState(true);
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/final.pdf", { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setPdfAvailable(false);
          setPdfError(`HTTP ${res.status} ${res.statusText}`);
        } else {
          setPdfAvailable(true);
          setPdfError(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setPdfAvailable(false);
        setPdfError(err.message || "Failed to fetch");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onDocumentLoadSuccess(pdf) {
    const total = pdf?.numPages || 0;
    setNumPages(total);
    if (page > total) onChangePage(1);
  }

  function onDocumentLoadError(error) {
    setPdfAvailable(false);
    setPdfError(error?.message ?? String(error));
    console.error("PDF load error:", error);
  }

  // simple keyboard shortcuts for paging and zoom
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") onChangePage(Math.max(1, page - 1));
      if (e.key === "ArrowRight") onChangePage(Math.min(numPages || 1, page + 1));
      if (e.key === "+" || (e.key === "=" && (e.ctrlKey || e.metaKey) === false)) setScale((s) => +(s + 0.1).toFixed(2));
      if (e.key === "-") setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, numPages, onChangePage]);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
            onClick={() => onChangePage(Math.max(1, page - 1))}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
            onClick={() => onChangePage(Math.min(numPages || 1, page + 1))}
          >
            Next
          </button>

          <div className="ml-3 flex items-center space-x-2">
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
            >
              −
            </button>
            <div className="text-sm">{Math.round(scale * 100)}%</div>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setScale((s) => +(s + 0.1).toFixed(2))}
            >
              +
            </button>
            <button
              className="ml-2 px-2 py-1 text-sm text-blue-600 underline"
              onClick={() => setScale(1.1)}
            >
              Fit
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-700">
          Page {page} {numPages ? `of ${numPages}` : ""}
        </div>
      </div>

      <div className="flex justify-center">
        {!pdfAvailable ? (
          <div className="p-6 bg-white border rounded text-center">
            <div className="text-red-600 font-medium">Failed to load PDF file</div>
            <div className="text-sm text-gray-600 mt-2">{pdfError}</div>
            <div className="mt-3 text-sm">
              Make sure `final.pdf` is placed in the project's <code>/public</code> folder and the dev server was restarted.
            </div>
          </div>
        ) : (
          <Document
            file="/final.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div>Loading PDF…</div>}
          >
            <div className="shadow bg-white">
              <Page pageNumber={page} scale={scale} />
            </div>
          </Document>
        )}
      </div>

      {numPages > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`px-2 py-1 border rounded ${p === page ? "bg-blue-600 text-white" : "bg-white"}`}
              onClick={() => onChangePage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

