import { describe, expect, it } from "vitest";
import {
  applyIntakeAnswer,
  createEmptyIntake,
  getNextAssistantMessage,
  INTAKE_QUESTIONS,
  validateIntakeAnswer,
} from "./user-brain-intake";

const nameQ = INTAKE_QUESTIONS[0];
const roleQ = INTAKE_QUESTIONS[1];
const aiQ = INTAKE_QUESTIONS.find((q) => q.id === "ai_comfort")!;

describe("validateIntakeAnswer", () => {
  it("rejects empty required answers and short names", () => {
    expect(validateIntakeAnswer(nameQ, "  ")).toMatch(/need something/i);
    expect(validateIntakeAnswer(nameQ, "A")).toMatch(/name or nickname/i);
    expect(validateIntakeAnswer(nameQ, "Jo")).toBeNull();
  });

  it("rejects confused or too-short answers on non-name required questions", () => {
    expect(validateIntakeAnswer(roleQ, "idk")).toMatch(/real answer/i);
    expect(validateIntakeAnswer(roleQ, "skip")).toMatch(/real answer/i);
    expect(validateIntakeAnswer(roleQ, "ok")).toMatch(/bit more detail/i);
    expect(validateIntakeAnswer(aiQ, "what is that?")).toMatch(/real answer/i);
    expect(validateIntakeAnswer(roleQ, "Head of Sales for Direct Sales")).toBeNull();
  });
});

describe("applyIntakeAnswer + getNextAssistantMessage", () => {
  it("advances questionIndex once and asks the next real question (no double-advance)", () => {
    const empty = createEmptyIntake();
    expect(empty.questionIndex).toBe(0);

    const afterName = applyIntakeAnswer(empty, nameQ, "  Matthew  ");
    expect(afterName.name).toBe("Matthew");
    expect(afterName.questionIndex).toBe(1);
    expect(afterName.rawAnswers).toEqual([
      { questionId: "name", question: nameQ.text, answer: "Matthew" },
    ]);
    expect(empty.questionIndex).toBe(0);

    const next = getNextAssistantMessage(afterName, "Matthew", nameQ);
    expect(next).toContain(roleQ.text);
    expect(next).not.toContain(INTAKE_QUESTIONS[2].text);
  });

  it("returns null after the final answer so the UI can close the interview", () => {
    let intake = createEmptyIntake();
    for (const question of INTAKE_QUESTIONS) {
      intake = applyIntakeAnswer(intake, question, `Answer about ${question.id} here`);
    }
    expect(intake.questionIndex).toBe(INTAKE_QUESTIONS.length);

    const lastQ = INTAKE_QUESTIONS[INTAKE_QUESTIONS.length - 1];
    expect(getNextAssistantMessage(intake, "done", lastQ)).toBeNull();
  });
});
