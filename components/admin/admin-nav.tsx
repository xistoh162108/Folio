import Link from "next/link"

const links = [
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/community", label: "Community" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/settings", label: "Settings" },
]

export function AdminNav() {
  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-[#D4FF00]/40 hover:text-[#D4FF00]">
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
