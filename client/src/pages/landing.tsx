import Navigation from "@/components/ui/navigation";
import HeroSection from "@/components/ui/hero-section";
import TokenShowcase from "@/components/ui/token-showcase";
import BenefitsSection from "@/components/ui/benefits-section";
import ProblemSolution from "@/components/ui/problem-solution";
import Footer from "@/components/ui/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <TokenShowcase />
      <BenefitsSection />
      <ProblemSolution />
      <Footer />
    </div>
  );
}
