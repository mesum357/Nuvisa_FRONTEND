import dynamic from "next/dynamic";

const HomePageClient = dynamic(() => import("@/components/home/HomePageClient"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full min-h-screen pri_bg text-white"
      aria-busy="true"
      aria-label="Loading homepage"
    >
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-4xl w-full space-y-6 animate-pulse">
          <div className="h-16 sm:h-24 bg-white/10 rounded-2xl" />
          <div className="h-8 bg-white/10 rounded-xl max-w-md mx-auto" />
        </div>
      </div>
    </div>
  ),
});

export default function Index() {
  return <HomePageClient />;
}
