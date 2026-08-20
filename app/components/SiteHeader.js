import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center">
          <img
            src="/logo.svg"
            alt="PIKAWORKS"
            className="h-5 w-auto transition-opacity hover:opacity-80"
          />
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-white/70">
          <Link className="transition-colors hover:text-white" href="/#products">
            제품
          </Link>
          <a
            className="transition-colors hover:text-white"
            href="https://blog.pikaworks.kr"
            target="_blank"
            rel="noopener noreferrer"
          >
            블로그
          </a>
        </nav>
      </div>
      <span className="block h-0.5 w-full bg-gradient-to-r from-brand via-brand-strong to-brand" />
    </header>
  );
}
