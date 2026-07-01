"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COMMAND_ROOMS } from "@/lib/command-centre/rooms";

const WORKSHOP_IMAGE_SRC = "/agent-cast/doc-albright/workshop/stage.png";

type StationHotspot = {
  stationId: string;
  ariaLabel: string;
  left: string;
  width: string;
  top: string;
  height: string;
};

/** Percentage-positioned targets on the 1024×576 workshop stage art. */
const STATION_HOTSPOTS: StationHotspot[] = [
  {
    stationId: "fleet",
    ariaLabel: "Design the fleet — task-scoped agents",
    left: "5%",
    width: "21%",
    top: "13%",
    height: "52%",
  },
  {
    stationId: "deploy",
    ariaLabel: "Package and deploy — HyperAgent-ready packages",
    left: "74%",
    width: "21%",
    top: "13%",
    height: "52%",
  },
  {
    stationId: "dispatch",
    ariaLabel: "Doc dispatch — implementation jobs board",
    left: "24%",
    width: "24%",
    top: "86%",
    height: "10%",
  },
  {
    stationId: "agents",
    ariaLabel: "Agent bases — persona config and memories",
    left: "52%",
    width: "24%",
    top: "86%",
    height: "10%",
  },
];

export function DocWorkshopHub() {
  const router = useRouter();
  const stations = COMMAND_ROOMS.doc.stations;
  const stationById = Object.fromEntries(stations.map((station) => [station.id, station]));

  return (
    <div className="doc-workshop-hub">
      <header className="doc-workshop-hub__header">
        <p className="doc-workshop-hub__label">Doc&apos;s workshop</p>
        <p className="doc-workshop-hub__subtitle">
          Agent building — pick a bench or the nameplate below
        </p>
      </header>

      <div className="doc-workshop-hub__stage">
        <div className="doc-workshop-hub__surface">
          <Image
            src={WORKSHOP_IMAGE_SRC}
            alt="Doc Albright at his steampunk workshop — brass automata in the side alcoves, forge glow behind the bench"
            fill
            priority
            sizes="100vw"
            className="doc-workshop-hub__image"
          />
          {STATION_HOTSPOTS.map((hotspot) => {
            const station = stationById[hotspot.stationId];
            if (!station) return null;

            return (
              <button
                key={hotspot.stationId}
                type="button"
                className="doc-workshop-hub__station"
                style={{
                  left: hotspot.left,
                  width: hotspot.width,
                  top: hotspot.top,
                  height: hotspot.height,
                }}
                aria-label={hotspot.ariaLabel}
                onClick={() => router.push(station.href)}
              />
            );
          })}
        </div>
      </div>

      <footer className="doc-workshop-hub__footer">
        <Link href="/#agent-cast" className="doc-workshop-hub__back">
          ← Back to command centre
        </Link>
      </footer>
    </div>
  );
}
