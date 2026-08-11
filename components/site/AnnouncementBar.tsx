import { FiInfo } from "react-icons/fi";

export function AnnouncementBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-navy text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium sm:text-sm">
        <FiInfo className="h-3.5 w-3.5 shrink-0 text-accent-light" />
        <span>{text}</span>
      </div>
    </div>
  );
}
