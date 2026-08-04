import { SignInForm } from "./sign-in-form";

/**
 * Operator sign-in — functional shell. Visual finish is Kate's lane
 * (scene-craft) once Phase 1 lands; this page deliberately carries no
 * marketing furniture and no global navigation.
 */
export default function SignInPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <SignInForm />
    </main>
  );
}
