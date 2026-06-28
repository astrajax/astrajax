import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { FeatureHub } from "@/components/FeatureHub";
import { FounderProof } from "@/components/FounderProof";
import { Problem } from "@/components/Problem";
import { Method } from "@/components/Method";
import { CitizenBuilder } from "@/components/CitizenBuilder";
import { Proof } from "@/components/Proof";
import { Adoption } from "@/components/Adoption";
import { Offers } from "@/components/Offers";
import { CliveSection } from "@/components/CliveSection";
import { CtaClose } from "@/components/CtaClose";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <div className="hero-immersive-room">
        <div className="hero-immersive-room__nav">
          <Nav immersive />
        </div>
        <Hero />
      </div>
      <main>
        <FeatureHub />
        <CliveSection />
        <FounderProof />
        <Problem />
        <Method />
        <CitizenBuilder />
        <Proof />
        <Adoption />
        <Offers />
        <CtaClose />
      </main>
      <Footer />
    </>
  );
}
