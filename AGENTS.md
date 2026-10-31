<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Talkly

- Pembagian folder dan aturan kerja: lihat `README.md` dan prompt tim (A Darryl, B Wayan, C Aditya). Edit hanya folder milik sendiri.
- Komponen klien yang memakai `useParams`, `usePathname`, atau `useSearchParams` harus dibungkus `<Suspense>`.
- Aturan lint melarang `setState` sinkron di dalam effect.
- Semua panggilan ke `/api` lewat `panggil()` di `lib/perangkat/panggil.ts`.
- Sebelum push: `git pull --rebase`, lalu `npm run periksa` harus hijau.
