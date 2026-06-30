import Link from "next/link";
import type { RoomStation } from "@/lib/command-centre/rooms";

type RoomStationGridProps = {
  stations: RoomStation[];
  stewardNote?: string;
};

export function RoomStationGrid({ stations, stewardNote }: RoomStationGridProps) {
  return (
    <div className="room-stations">
      {stewardNote ? (
        <p className="room-stations__steward mb-6 max-w-2xl text-sm leading-relaxed text-parchment/80">
          {stewardNote}
        </p>
      ) : null}
      <ul className="room-stations__grid">
        {stations.map((station) => (
          <li key={station.id}>
            <article className="room-station-card">
              {station.badge ? (
                <span className="room-station-card__badge">{station.badge}</span>
              ) : null}
              <h2 className="font-display text-lg font-semibold text-parchment">{station.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-parchment/75">
                {station.description}
              </p>
              <Link href={station.href} className="room-station-card__cta">
                {station.cta}
                <span aria-hidden>→</span>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
