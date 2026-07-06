import HeroSection from "@/components/sections/HeroSection";
import TrendingSection from "@/components/sections/TrendingSection";
import Advertisement from "@/components/ads/Advertisement";
import LiveDashboard from "@/components/sections/LiveDashboard";

import CategorySection from "@/components/sections/CategorySection";
import PhotoGallery from "@/components/sections/PhotoGallery";

export default function HomePage() {
  return (
    <div>
      {/* Main 3-column portal layout */}
      <HeroSection />

      {/* Trending strip */}
      <TrendingSection />

      {/* Live data dashboard */}
      <LiveDashboard />

      {/* Mid-page ad */}
      <div className="mx-auto max-w-screen-xl px-2 py-1">
        <Advertisement position="banner" />
      </div>



      {/* Extra category sections */}
      <CategorySection category="Business"       categorySlug="business"       categoryGu="બિઝનેસ"       cols={6} />
      <CategorySection category="Entertainment"  categorySlug="entertainment"  categoryGu="મનોરંજન"      cols={6} />
      <CategorySection category="Technology"     categorySlug="technology"     categoryGu="ટેકનોલોજી"    cols={6} />
      <CategorySection category="World"          categorySlug="world"          categoryGu="વિશ્વ"         cols={6} />
      <CategorySection category="Crime"          categorySlug="crime"          categoryGu="ક્રાઇમ"        cols={6} />
      <CategorySection category="Politics"       categorySlug="politics"       categoryGu="રાજકારણ"      cols={6} />
      <CategorySection category="Lifestyle"      categorySlug="lifestyle"      categoryGu="લાઇફસ્ટાઇલ"   cols={6} />
      <CategorySection category="Education"      categorySlug="education"      categoryGu="શિક્ષણ"       cols={6} />

      {/* Photo gallery */}
      <PhotoGallery />

      {/* Footer ad */}
      <div className="mx-auto max-w-screen-xl px-2 py-1">
        <Advertisement position="footer" />
      </div>
    </div>
  );
}
