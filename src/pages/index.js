import HomePageClient from "@/components/home/HomePageClient";
import HomeHeroPoster from "@/components/home/HomeHeroPoster";
import { DEFAULT_HERO_CONTENT } from "@/lib/defaultHeroContent";

export default function Home({ initialHeroContent }) {
  return (
    <HomePageClient
      initialHeroContent={initialHeroContent}
      heroPoster={<HomeHeroPoster />}
    />
  );
}

export async function getStaticProps() {
  return {
    props: {
      initialHeroContent: DEFAULT_HERO_CONTENT,
    },
    revalidate: 300,
  };
}
