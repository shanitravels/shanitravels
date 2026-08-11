"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiMenu, HiX } from "react-icons/hi";
import { FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { telHref, whatsappHref } from "@/lib/format";
import { useI18n } from "./LocaleProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Labels are resolved per-render from the dictionary, so the nav re-labels
 *  itself on a language switch without the route map changing. */
const LINKS = [
  { href: "/", key: "home" },
  { href: "/fleet", key: "fleet" },
  { href: "/rates", key: "rates" },
  { href: "/corporate", key: "corporate" },
  { href: "/industries", key: "industries" },
  { href: "/services", key: "services" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function Header({ helpline, whatsapp }: { helpline: string; whatsapp: string }) {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the drawer on navigation (adjust-state-during-render pattern).
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the drawer is open: lock body scroll, close on Escape, move focus in.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-navy/5 bg-white/90 backdrop-blur-md transition-all duration-300",
          scrolled || open ? "shadow-lg shadow-navy/5" : "shadow-sm shadow-navy/3"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            {/* The mark is wider than it is tall, so size by height and let the
                width follow — a square box would letterbox it and shrink it. */}
            <Image
              src="/logo.png"
              alt={t.nav.logoAlt}
              width={247}
              height={160}
              priority
              // Local /public asset: the Cloudinary loader passes it through
              // untouched, so there is no width to resolve and no srcset to build.
              unoptimized
              className="h-12 w-auto object-contain md:h-14"
            />
            <span className="leading-tight">
              <span className="block font-heading text-lg font-bold text-navy md:text-xl">
                {t.nav.brandName}
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                {t.nav.brandTagline}
              </span>
            </span>
          </Link>

          {/* gap-8 at exactly 1024px pushed the actions past the viewport edge —
              the desktop nav switches on at lg, where it only just fits. The
              roomier spacing returns at xl. */}
          <div className="hidden items-center gap-5 lg:flex xl:gap-8">
            {LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative py-1 text-sm font-medium transition-colors",
                    active ? "text-navy" : "text-navy/60 hover:text-navy"
                  )}
                >
                  {t.nav[link.key]}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-accent transition-transform duration-300 ease-out",
                      active ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />
            <Button href="/book" variant="accent" size="sm">
              {t.nav.bookShort}
            </Button>
          </div>

          <button
            aria-label={t.nav.openMenu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="-mr-1 flex h-11 w-11 items-center justify-center rounded-lg text-2xl text-navy transition hover:bg-navy/5 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <HiMenu />
          </button>
        </nav>
      </header>

      {/* Backdrop — fades with the panel. Always mounted so the exit animates. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-[60] bg-navy-deep/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Slide-in drawer */}
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.siteMenu}
        tabIndex={-1}
        inert={!open}
        className={cn(
          "fixed right-0 top-0 z-[70] flex h-[100dvh] w-[min(86vw,22rem)] flex-col bg-white shadow-2xl outline-none",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform lg:hidden",
          "motion-reduce:transition-none",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-xs font-bold text-white">
              ST
            </span>
            <span className="font-heading text-base font-bold text-navy">{t.nav.menu}</span>
          </span>
          <button
            aria-label={t.nav.closeMenu}
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-navy transition hover:bg-navy/5"
          >
            <HiX />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label={t.nav.mobile}>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex min-h-[48px] items-center justify-between rounded-lg px-4 text-[15px] font-medium transition",
                isActive(link.href)
                  ? "bg-accent/10 text-navy"
                  : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              )}
            >
              {t.nav[link.key]}
              <FiArrowRight
                className={cn("h-4 w-4", isActive(link.href) ? "text-accent" : "text-navy/25")}
              />
            </Link>
          ))}
        </nav>

        <div className="space-y-2 border-t border-line px-4 py-4">
          <Button href="/book" variant="accent" className="w-full">
            {t.nav.bookVehicle}
          </Button>
          <LanguageSwitcher className="w-full justify-center py-2.5" />
          <div className="grid grid-cols-2 gap-2">
            <a
              href={telHref(helpline)}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-line text-sm font-semibold text-navy transition hover:bg-band"
            >
              <FaPhoneAlt className="text-xs text-accent" /> {t.nav.call}
            </a>
            <a
              href={whatsappHref(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-line text-sm font-semibold text-[#25D366] transition hover:bg-band"
            >
              <FaWhatsapp /> {t.nav.whatsapp}
            </a>
          </div>
          <p className="tabular pt-1 text-center text-xs text-muted">{helpline}</p>
        </div>
      </div>
    </>
  );
}
