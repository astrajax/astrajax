import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { FounderProof } from "@/components/FounderProof";
import { Problem } from "@/components/Problem";
import { Method } from "@/components/Method";
import { Proof } from "@/components/Proof";
import { Adoption } from "@/components/Adoption";
import { Offers } from "@/components/Offers";
import { CliveSection } from "@/components/CliveSection";
import { CtaClose } from "@/components/CtaClose";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FounderProof />
        <Problem />
        <Method />
        <Proof />
        <CliveSection />
        <Adoption />
        <Offers />
        <CtaClose />
      </main>
      <Footer />
    </>
  );
}
