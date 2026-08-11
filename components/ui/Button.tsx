import Link from "next/link";
import { cn } from "@/lib/utils";

type BaseProps = {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "navy" | "outline" | "outline-navy" | "glass";
  size?: "sm" | "md" | "lg";
  className?: string;
};

type ButtonAsLink = BaseProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type ButtonAsButton = BaseProps & {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
};

type ButtonProps = ButtonAsLink | ButtonAsButton;

const variants = {
  primary:
    "bg-navy text-white hover:bg-navy-light shadow-[0_8px_20px_-8px_rgba(11,36,71,0.5)]",
  accent:
    "bg-accent text-white hover:bg-accent-light shadow-[0_8px_20px_-8px_rgba(200,16,46,0.55)]",
  navy:
    "bg-navy text-white hover:bg-navy-light shadow-[0_8px_20px_-8px_rgba(11,36,71,0.5)]",
  outline:
    "border border-white/45 text-white hover:bg-white/10 hover:border-white",
  "outline-navy":
    "border border-navy/20 text-navy hover:bg-navy hover:text-white hover:border-navy",
  glass: "glass text-white hover:bg-white/15",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm md:text-[15px]",
  lg: "px-7 py-3.5 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
