/** Compact page header band for interior public pages. */
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-navy-deep">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">{description}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
