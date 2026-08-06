import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "archive"
  | "arrow-left"
  | "arrow-right"
  | "book"
  | "calendar"
  | "check"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "contrast"
  | "download"
  | "eye"
  | "file-text"
  | "fullscreen"
  | "grayscale"
  | "menu"
  | "minus"
  | "newspaper"
  | "nfc"
  | "pause"
  | "play"
  | "plus"
  | "reset"
  | "search"
  | "share"
  | "shield"
  | "text"
  | "user"
  | "volume"
  | "zoom-in"
  | "zoom-out";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, ReactNode> = {
  archive: <><path d="M3 6h18"/><path d="M5 6v14h14V6"/><path d="M8 10h8"/><path d="M9 14h6"/></>,
  "arrow-left": <><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></>,
  "arrow-right": <><path d="m9 18 6-6-6-6"/><path d="M5 12h10"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  "chevron-left": <path d="m15 18-6-6 6-6"/>,
  "chevron-right": <path d="m9 18 6-6-6-6"/>,
  close: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  contrast: <><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/></>,
  download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></>,
  "file-text": <><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
  fullscreen: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></>,
  grayscale: <><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  minus: <path d="M5 12h14"/>,
  newspaper: <><path d="M4 4h13v16H4z"/><path d="M17 8h3v12a2 2 0 0 1-2 2H6"/><path d="M7 8h7M7 12h7M7 16h4"/></>,
  nfc: <><path d="M6 8a6 6 0 0 1 0 8M10 10a3 3 0 0 1 0 4M18 8a6 6 0 0 0 0 8M14 10a3 3 0 0 0 0 4"/><circle cx="12" cy="12" r="1"/></>,
  pause: <><path d="M9 5v14M15 5v14"/></>,
  play: <path d="m8 5 11 7-11 7z"/>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  share: <><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
  text: <><path d="M4 6V4h16v2M12 4v16M8 20h8"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  volume: <><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/></>,
  "zoom-in": <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/></>,
  "zoom-out": <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6"/></>,
};

export function Icon({
  name,
  size = 20,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
