export type Platform = "linkedin" | "x" | "instagram";

export type PreviewStyle = "professional" | "compact" | "visual";

export interface PlatformMeta {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverGlow: string;
  previewStyle: PreviewStyle;
  maxLength: number;
  /** CSS gradient string for platforms with gradient branding (e.g. Instagram) */
  gradient?: string;
}

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  linkedin: {
    label: "LinkedIn",
    emoji: "\uD83D\uDCBC",
    color: "#0A66C2",
    bgColor: "#FFFFFF",
    borderColor: "#0A66C2",
    hoverGlow: "shadow-[0_0_15px_rgba(10,102,194,0.25)]",
    previewStyle: "professional",
    maxLength: 3000,
  },
  x: {
    label: "X (Twitter)",
    emoji: "\uD83D\uDC26",
    color: "#000000",
    bgColor: "#FFFFFF",
    borderColor: "#E1E8ED",
    hoverGlow: "shadow-[0_0_15px_rgba(0,0,0,0.15)]",
    previewStyle: "compact",
    maxLength: 280,
  },
  instagram: {
    label: "Instagram",
    emoji: "\uD83D\uDCF8",
    color: "#833AB4",
    bgColor: "#FAFAFA",
    borderColor: "#DBDBDB",
    hoverGlow: "shadow-[0_0_15px_rgba(131,58,180,0.25)]",
    previewStyle: "visual",
    maxLength: 2200,
    gradient: "linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)",
  },
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  instagram: "Instagram",
};

export const ALL_PLATFORMS: Platform[] = ["linkedin", "x", "instagram"];
