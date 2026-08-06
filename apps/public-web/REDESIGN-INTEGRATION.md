# Temiryo‘lchi public-web redesign

Google AI Studio dizayni amaldagi Next.js 16 + Django public API loyihasiga moslashtirildi.

## Saqlangan real integratsiyalar

- `BACKEND_API_URL` orqali Django public API
- `/`
- `/arxiv`
- `/n/[nfcSlug]`
- `/maqola/[id]`
- NFC gazeta viewer
- haqiqiy `snake_case` API turlari

## Qo‘shilgan imkoniyatlar

- premium editorial dizayn
- mobil menyu
- qidiruv oynasi va `/qidiruv` sahifasi
- accessibility toolbar
- shrift o‘lchami, yuqori kontrast va oq-qora rejim
- localStorage orqali accessibility sozlamalarini saqlash
- arxiv qidiruvi va yil filtri
- viewer: zoom, fit-to-width, fullscreen, keyboard navigation
- maqola sahifasida font size, share va audio speed boshqaruvi

## Tekshirish

```powershell
cd C:\Users\Anvar\Desktop\nfc_gazeta\apps\public-web
npm install
npm run type-check
npm run lint
npm run build
npm run dev
```

Backend `http://127.0.0.1:8000` da ishlashi kerak.
