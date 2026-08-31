import Link from "next/link";
import { IndustryIcon } from "./IndustryIcon";
import type { Industry } from "@/lib/types";

/**
 * The industry card grid, shared by the homepage block and /industries.
 *
 * One component rather than the same markup twice: the homepage grid replaced
 * the client logo wall and the listing page is the place it links on to, so the
 * two are seen back to back. Two copies would drift the moment either is
 * tweaked.
 *
 * Four across from `lg` — twelve industries then land as 4x3 rather than
 * running 3x4 down the page.
 */
export function IndustryCards({
  industries,
  headingAs: Heading = "h3",
}: {
  industries: Industry[];
  /**
   * Depends on what sits above the grid. The homepage puts it under a section
   * `h2`, so the cards are `h3`; the listing page has only the page `h1` above
   * it, so they are `h2` there. Passing the level keeps the outline correct on
   * both rather than picking one and being wrong on the other.
   */
  headingAs?: "h2" | "h3";
}) {
  if (industries.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {industries.map((ind) => (
        <li key={ind.id} className="flex">
          <Link
            href={`/industries/${ind.slug}`}
            className="group flex w-full flex-col rounded-2xl border border-line bg-white p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lift"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
              <IndustryIcon name={ind.icon} />
            </span>
            <Heading className="mt-3 font-heading text-sm font-bold leading-snug text-navy">
              {ind.name}
            </Heading>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{ind.summary}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
