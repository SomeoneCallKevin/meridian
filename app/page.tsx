import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TickerStrip from "@/components/landing/TickerStrip";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Features from "@/components/landing/Features";
import { HowItWorks, SignalTypes, Stats, CTA, Footer } from "@/components/landing/Sections";

export default function Home() {
  return (
    <main className="bg-deep text-t-primary min-h-screen">
      <Navbar />
      <Hero />
      <TickerStrip />
      <DashboardPreview />
      <Features />
      <HowItWorks />
      <SignalTypes />
      <Stats />
      <CTA />
      <Footer />
    </main>
  );
}
