import Link from 'next/link';
import { PRODUCTS } from '../data/products';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 py-10 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <img src="/logo-dark.svg" alt="PIKAWORKS" className="h-5 w-auto" />
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {PRODUCTS.map((p) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="text-sm font-medium text-muted transition-colors hover:text-brand"
              >
                {p.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-1 sm:items-end">
          <a
            href="mailto:pikaworks.help@gmail.com"
            className="text-sm font-medium text-muted transition-colors hover:text-brand"
          >
            pikaworks.help@gmail.com
          </a>
          <span className="text-xs text-muted/80">
            © {new Date().getFullYear()} PIKAWORKS. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
