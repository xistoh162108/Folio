import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm text-zinc-200">
        <Link href="/" className="font-mono font-semibold tracking-[0.24em] text-[#D4FF00]">
          XISTOH.LOG
        </Link>
        <nav className="flex items-center gap-4 font-mono text-zinc-400">
          <Link href="/knowledge" className="transition hover:text-white">
            Knowledge
          </Link>
          <Link href="/notes" className="transition hover:text-white">
            Notes
          </Link>
          <Link href="/projects" className="transition hover:text-white">
            Projects
          </Link>
          <Link href="/guestbook" className="transition hover:text-white">
            Guestbook
          </Link>
          <Link href="/#contact" className="transition hover:text-white">
            Contact
          </Link>
          <Link href="/admin/posts" className="transition hover:text-white">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
