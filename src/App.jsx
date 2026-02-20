import React, { useState, useRef, useEffect } from "react";
import PdfViewer from "./components/PdfViewer";
import ClaimPanel from "./components/ClaimPanel";

export default function App() {
  const [page, setPage] = useState(1);
  const [leftWidth, setLeftWidth] = useState(50); // percent
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState("pdf"); // "pdf" or "panel"
  const containerRef = useRef();

  function onDragStart(e) {
    const startX = e.clientX;
    const startWidth = leftWidth;
    function onMove(ev) {
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ev.clientX - startX;
      const newPercent = Math.max(20, Math.min(80, ((startWidth / 100) * rect.width + dx) / rect.width * 100));
      setLeftWidth(newPercent);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 768);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm py-3 px-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Medical Claim Review</h1>
          <div className="text-sm text-gray-500">Compare PDF and extracted data side-by-side</div>
        </div>
        <div className="text-sm text-gray-600">Session: quick-demo</div>
      </header>

      <main ref={containerRef} className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {isMobile ? (
          <>
            <div className="flex-shrink-0 bg-white border-b">
              <div className="flex items-center justify-center gap-2 p-2">
                <button
                  onClick={() => setMobileView("pdf")}
                  className={`flex-1 text-center px-3 py-2 rounded ${mobileView === "pdf" ? "bg-blue-600 text-white" : "bg-white border"}`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setMobileView("panel")}
                  className={`flex-1 text-center px-3 py-2 rounded ${mobileView === "panel" ? "bg-blue-600 text-white" : "bg-white border"}`}
                >
                  Details
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {mobileView === "pdf" ? (
                <div className="bg-gray-50 min-h-full">
                  <PdfViewer page={page} onChangePage={setPage} />
                </div>
              ) : (
                <div className="p-4">
                  <ClaimPanel onJumpToPage={(p) => { setPage(p); setMobileView("pdf"); }} />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div
              className="border-b md:border-b-0 md:border-r bg-gray-50 overflow-auto"
              style={{ width: `${leftWidth}%`, minWidth: 240 }}
            >
              <PdfViewer page={page} onChangePage={setPage} />
            </div>

            <div
              onMouseDown={onDragStart}
              className="cursor-col-resize bg-transparent"
              style={{ width: 8 }}
              title="Drag to resize panes"
            />

            <div className="p-6 overflow-auto" style={{ width: `${100 - leftWidth}%` }}>
              <ClaimPanel onJumpToPage={setPage} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
