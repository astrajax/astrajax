import type { LoopStep } from "@/lib/aie-demo/types";
import { LOOP_STEPS, STEP_LABELS } from "@/lib/aie-demo/types";

interface StepperProps {
  currentStep: LoopStep;
  completedSteps: Set<LoopStep>;
  onJump?: (step: LoopStep) => void;
}

export function Stepper({ currentStep, completedSteps, onJump }: StepperProps) {
  const currentIndex = LOOP_STEPS.indexOf(currentStep);

  return (
    <nav aria-label="Chapter 1 flow" className="space-y-1">
      {LOOP_STEPS.map((step, index) => {
        const isCurrent = step === currentStep;
        const isComplete = completedSteps.has(step) || index < currentIndex;
        const canJump = onJump && (isComplete || index <= currentIndex);

        return (
          <button
            key={step}
            type="button"
            disabled={!canJump}
            onClick={() => canJump && onJump?.(step)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
              isCurrent
                ? "bg-apricot/15 font-medium text-ink ring-1 ring-apricot/30"
                : isComplete
                  ? "text-ink hover:bg-ink/5"
                  : "text-ink-muted/60"
            } ${canJump ? "cursor-pointer" : "cursor-default"}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                isCurrent
                  ? "bg-apricot text-white"
                  : isComplete
                    ? "bg-sage/30 text-ink"
                    : "bg-ink/5 text-ink-muted"
              }`}
            >
              {index + 1}
            </span>
            <span>{STEP_LABELS[step]}</span>
          </button>
        );
      })}
    </nav>
  );
}
