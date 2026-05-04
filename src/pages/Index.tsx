import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrandsMarquee from "@/components/BrandsMarquee";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import EasyBuyBanner from "@/components/EasyBuyBanner";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <BrandsMarquee />
      <CategoriesSection />
      <FeaturedProducts />
      <EasyBuyBanner />
      <Footer />
    </div>
  );
};

export default Index;
