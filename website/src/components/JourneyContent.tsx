import { JourneyTimeline } from "@/components/JourneyTimeline";
import {
  journeyActs,
  journeyClose,
  journeyIntro,
} from "@/lib/journey";

export function JourneyContent() {
  return (
    <JourneyTimeline
      intro={journeyIntro}
      acts={journeyActs}
      close={journeyClose}
    />
  );
}
