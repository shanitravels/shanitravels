import type { IconType } from "react-icons";
import { FaWhatsapp, FaFacebookF, FaInstagram, FaPinterestP, FaLinkedinIn } from "react-icons/fa";
import { whatsappHref } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";

export type SocialKey = "instagram" | "facebook" | "pinterest" | "linkedin" | "whatsapp";

/**
 * One account, as plain strings.
 *
 * No icon component on here on purpose. The hero is a client component, and a
 * function cannot cross the server/client boundary as a prop — passing one
 * builds cleanly and then throws at request time. The icon is looked up from
 * `SOCIAL_ICONS` by whichever component renders the list.
 */
export interface SocialLinkItem {
  key: SocialKey;
  label: string;
  href: string;
}

/** Imported directly by the renderer, never passed as a prop. */
export const SOCIAL_ICONS: Record<SocialKey, IconType> = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  pinterest: FaPinterestP,
  linkedin: FaLinkedinIn,
  whatsapp: FaWhatsapp,
};

/**
 * The social accounts to show, in display order, skipping any the admin has
 * not filled in.
 *
 * Shared so the footer and the hero cannot drift: the networks, their order and
 * their icons are decided once. Each caller still styles its own buttons — the
 * footer uses filled squares on navy, the hero outlined circles over a
 * photograph — because that is presentation, not content.
 *
 * WhatsApp comes last and from a different field: it is the business's phone
 * number rather than a profile URL, so it is always available even when no
 * social account has been set.
 */
export function socialLinks(
  socials: SiteSettings["socials"],
  whatsappNumber?: string
): SocialLinkItem[] {
  const items: SocialLinkItem[] = [];

  if (socials.instagram)
    items.push({ key: "instagram", label: "Instagram", href: socials.instagram });
  if (socials.facebook)
    items.push({ key: "facebook", label: "Facebook", href: socials.facebook });
  if (socials.pinterest)
    items.push({ key: "pinterest", label: "Pinterest", href: socials.pinterest });
  if (socials.linkedin)
    items.push({ key: "linkedin", label: "LinkedIn", href: socials.linkedin });
  if (whatsappNumber)
    items.push({ key: "whatsapp", label: "WhatsApp", href: whatsappHref(whatsappNumber) });

  return items;
}
