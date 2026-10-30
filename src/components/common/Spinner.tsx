import React from "react";

export interface SpinnerProps {
  fullScreen?: boolean;
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const BrandLoader: React.FC<SpinnerProps> = ({
  fullScreen = true,
  text = "Loading...",
  size = "md",
  className = "",
}) => {
  const logoDimensions =
    size === "sm"
      ? "w-8 h-8"
      : size === "lg"
      ? "w-16 h-16"
      : "w-12 h-12";

  const ringDimensions =
    size === "sm"
      ? "w-12 h-12"
      : size === "lg"
      ? "w-24 h-24"
      : "w-18 h-18";

  const textSize =
    size === "sm"
      ? "text-xs"
      : size === "lg"
      ? "text-base"
      : "text-sm";

  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      {/* Branded Logo Container */}
      <div className="relative flex items-center justify-center">
        {/* Subtle rotating accent ring */}
        <div
          className={`absolute rounded-full border border-neutral-200/80 dark:border-neutral-800/80 border-t-emerald-600 dark:border-t-emerald-400 animate-spin [animation-duration:2.5s] ${ringDimensions}`}
        />

        {/* Center Navbar Logo with gentle pulse */}
        <img
          src="https://res.cloudinary.com/dmiwq3l2s/image/upload/v1764768203/vfw82jmca7zl5p86czhy.png"
          alt="Decor Drapes Instyle"
          className={`relative ${logoDimensions} object-contain select-none animate-logo-pulse drop-shadow-sm`}
        />
      </div>

      {/* Shimmer Loading Text */}
      {text && (
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <p
            className={`font-display font-semibold tracking-wider ${textSize} animate-shimmer-text select-none`}
          >
            {text}
          </p>
          
        </div>
      )}
    </div>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md transition-colors">
      {content}
    </div>
  );
};

export default BrandLoader;
