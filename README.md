# Medical Claim Review Dashboard

Simple React + Tailwind app to review medical claims side-by-side with the PDF.

Setup
- Place `final.pdf` and `data.json` into the project's `public/` folder (create `public/` if missing).
- Install dependencies:

```
npm install
```

- Run dev server:

```
npm run dev
```

What I built
- Left: PDF viewer (clickable page numbers)
- Right: Parsed JSON rendering:
  - Claim summary, patient info
  - Bills & items (NME items highlighted in red)
  - Audit issues & document segments (page numbers clickable)

Notes
- This is a minimal, functional scaffold in JavaScript. I recommend recording a short video showing how to run `npm install` and `npm run dev`, and placing the two files into `public/`.

