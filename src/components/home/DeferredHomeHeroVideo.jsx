"use client";

import dynamic from "next/dynamic";

const HomeHeroDesktopVideo = dynamic(() => import("./HomeHeroDesktopVideo"), {
  ssr: false,
  loading: () => null,
});

/**
 * Desktop MP4 only — poster is rendered separately (HomeHeroPoster) for LCP.
 */
export default function DeferredHomeHeroVideo() {
  return <HomeHeroDesktopVideo />;
}
