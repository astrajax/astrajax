"use server";

import { auth } from "@/lib/auth";
import {
  handleReceivingWallAccept,
  type ReceivingWallAcceptResult,
} from "../handlers/receiving-wall-accept";

export type AcceptReceivingWallResponse =
  | { ok: true; data: ReceivingWallAcceptResult }
  | { ok: false; error: string };

/**
 * Browser entry for Accept. The shared Doc-promote secret cannot travel with
 * the client, so this action used to be wide open — anyone with a draft
 * record id (from the public wall list) could mark it Approved. Require a
 * signed-in operator session instead.
 */
export async function acceptReceivingWallRecord(input: {
  recordId: string;
  actor?: string;
}): Promise<AcceptReceivingWallResponse> {
  try {
    const session = await auth();
    if (!session?.operator?.operatorId) {
      return { ok: false, error: "Sign in to accept a draft on the Receiving Wall." };
    }
    const data = await handleReceivingWallAccept({
      ...input,
      actor: input.actor?.trim() || session.operator.email || "Architect",
    });
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not accept this record.";
    console.error("Receiving Wall accept action failed:", message);
    return { ok: false, error: message };
  }
}
