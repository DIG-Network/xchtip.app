// SafeLogoImage — renders a user-supplied logo URL SAFELY: ONLY as a plain `<img src>` (never
// inline HTML/SVG markup, never a CSS background — either of which could execute or leak the page
// via a crafted payload). Hardened with `referrerpolicy="no-referrer"`, `loading="lazy"`,
// `decoding="async"`, and fixed dimensions (no layout shift). On a load error it swaps to
// `fallback` (typically the built-in AssetGlyph mark) so a broken/unreachable URL never leaves a
// broken image icon. Callers are responsible for URL validation (see lib/logo.ts) — this component
// does not re-validate `src`.

import { useState, type ReactNode } from "react";

export interface SafeLogoImageProps {
  /** The (already-validated) logo URL. */
  src: string;
  /** Accessible label — typically the asset symbol/name. */
  alt: string;
  className?: string;
  /** Pixel size (square) — fixed so the layout never shifts while the image loads. */
  size?: number;
  /** Rendered instead when the image fails to load; omit for "render nothing" on failure. */
  fallback?: ReactNode;
  /** Called (in addition to the fallback swap) when the image fails to load. */
  onError?: () => void;
}

export function SafeLogoImage({ src, alt, className, size = 20, fallback, onError }: SafeLogoImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback ?? null}</>;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        setFailed(true);
        onError?.();
      }}
    />
  );
}
