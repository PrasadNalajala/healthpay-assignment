import React, { useState, useRef } from "react";
import PdfViewer from "./components/PdfViewer";
import ClaimPanel from "./components/ClaimPanel";

export default function App() {
  const [page, setPage] = useState(1);
  const [leftWidth, setLeftWidth] = useState(50); // percent
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

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm py-3 px-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Medical Claim Review</h1>
          <div className="text-sm text-gray-500">Compare PDF and extracted data side-by-side</div>
        </div>
        <div className="text-sm text-gray-600">Session: quick-demo</div>
      </header>

      <main ref={containerRef} className="flex-1 flex overflow-hidden">
        <div
          className="border-r bg-gray-50 overflow-auto"
          style={{ width: `${leftWidth}%` }}
        >
          <PdfViewer page={page} onChangePage={setPage} />
        </div>

        <div
          onMouseDown={onDragStart}
          className="cursor-col-resize bg-transparent w-1"
          style={{ width: 8 }}
          title="Drag to resize panes"
        />

        <div className="p-6 overflow-auto" style={{ width: `${100 - leftWidth}%` }}>
          <ClaimPanel onJumpToPage={setPage} />
        </div>
      </main>
    </div>
  );
}
