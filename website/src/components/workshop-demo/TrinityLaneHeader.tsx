"use client";

import type { WorkshopBuildStep } from "@/lib/workshop-demo/types";
import { laneForStep } from "@/lib/workshop-demo/types";

const LANES = [
  { id: "proposer" as const, label: "Proposer", model: "Fable-class" },
  { id: "challenger" as const, label: "Challenger", model: "Fable-class" },
  { id: "human" as const, label: "Matthew", model: "Human gate" },
  { id: "builder" as const, label: "Builder", model: "Composer" },
];

type TrinityLaneHeaderProps = {
  currentStep: WorkshopBuildStep;
};

export function TrinityLaneHeader({ currentStep }: TrinityLaneHeaderProps) {
  const activeLane = laneForStep(currentStep);

  return (
    <nav className="workshop-trinity-lanes" aria-label="Doc's Workshop Trinity lanes">
      <ol className="workshop-trinity-lanes__list">
        {LANES.map((lane) => {
          const isActive = activeLane === lane.id;
          return (
            <li
              key={lane.id}
              className={`workshop-trinity-lanes__item${isActive ? " workshop-trinity-lanes__item--active" : ""}`}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="workshop-trinity-lanes__label">{lane.label}</span>
              <span className="workshop-trinity-lanes__model">{lane.model}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
