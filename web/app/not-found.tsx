import Link from 'next/link'

/** Статична 404 — без динаміки, щоб завжди віддалась при невідомому маршруті. */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-neutral-400 text-sm font-semibold uppercase tracking-widest">404</p>
      <h1 className="font-semibold text-[#145142] text-xl sm:text-2xl">Сторінку не знайдено</h1>
      <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
        Можливо, посилання застаріло або адресу введено з помилкою.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex rounded-xl bg-watta-action px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-watta-action-hover"
      >
        На головну
      </Link>
    </div>
  )
}
