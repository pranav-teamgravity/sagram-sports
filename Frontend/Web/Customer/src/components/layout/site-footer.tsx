import Link from "next/link";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/jerseys?sport=football", label: "Football jerseys" },
      { href: "/jerseys?sport=cricket", label: "Cricket jerseys" },
      { href: "/jerseys?sport=retro", label: "Retro jerseys" },
      { href: "/custom", label: "Custom jerseys" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/help/size-guide", label: "Size guide" },
      { href: "/help/delivery", label: "Delivery" },
      { href: "/help/returns", label: "Returns and exchanges" },
      { href: "/account/orders", label: "Track your order" },
    ],
  },
  {
    title: "Sagram Sports",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of sale" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-4xl font-black">Sagram</p>
          <p className="mt-3 max-w-xs text-white/70">
            Jerseys for football and cricket fans, printed with your name and number.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-display text-xl font-bold">{col.title}</h2>
            <ul className="mt-3 space-y-2 text-white/75">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-shirt">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-white/60 sm:px-6">
          © {new Date().getFullYear()} Sagram Sports
        </p>
      </div>
    </footer>
  );
}
