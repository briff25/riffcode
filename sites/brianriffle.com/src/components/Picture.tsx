import type { Picture as PictureData } from "@/content/press";

type Props = {
  image: PictureData;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

// Static export has no image optimizer, so media is pre-sized by
// scripts/prepare-media.mjs and served as WebP with a JPEG fallback.
export default function Picture({ image, sizes = "100vw", className, priority }: Props) {
  const { src, widths, width, height, alt } = image;
  const set = (ext: string) =>
    widths ? widths.map((w) => `${src}-${w}.${ext} ${w}w`).join(", ") : `${src}.${ext}`;
  const fallback = widths ? `${src}-${widths[widths.length - 1]}.jpg` : `${src}.jpg`;

  return (
    <picture>
      <source type="image/webp" srcSet={set("webp")} sizes={widths ? sizes : undefined} />
      <img
        src={fallback}
        srcSet={widths ? set("jpg") : undefined}
        sizes={widths ? sizes : undefined}
        width={width}
        height={height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
