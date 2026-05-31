import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { SeedsOfPromiseContent } from "@/components/SeedsOfPromiseContent";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Seeds of Promise - Turn access into agency",
  description:
    "A practical Malawi pilot that connects a community computer centre, captures local context, and builds narrow AI agents for education, farming, fundraising, and local enterprise.",
};

export default function SeedsOfPromisePage() {
  return (
    <>
      <Nav />
      <SeedsOfPromiseContent />
      <Footer />
    </>
  );
}
