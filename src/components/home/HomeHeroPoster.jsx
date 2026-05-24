import {
  HERO_POSTER_PNG,
  HERO_POSTER_WEBP,
} from "@/utils/heroPoster";

/**
 * LCP hero background — plain <img> (no next/image) for fastest mobile paint.
 * Rendered from the server page via slot prop when possible.
 */
export default function HomeHeroPoster() {
  return (
    <div className="absolute inset-0 z-0" aria-hidden>
      <picture>
        <source srcSet={HERO_POSTER_WEBP} type="image/webp" />
        <img
          src={HERO_POSTER_PNG}
          alt=""
          width={1200}
          height={800}
          decoding="async"
          fetchPriority="high"
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover md:scale-[1.2]"
        />
      </picture>
      <div className="absolute inset-0 bg-black/45" />
    </div>
  );
}
