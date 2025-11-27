import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CarGrid from "@/components/CarGrid";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background w-full max-w-[100vw] overflow-x-hidden">
      <SEOHead />
      <Header />
      <Hero />
      <CarGrid />
      <Footer />
    </div>
  );
};

export default Index;
