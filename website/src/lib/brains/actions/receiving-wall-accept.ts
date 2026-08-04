"use server";

import {
  handleReceivingWallAccept,
  type ReceivingWallAcceptResult,
} from "../handlers/receiving-wall-accept";

export type AcceptReceivingWallResponse =
  | { ok: true; data: ReceivingWallAcceptResult }
  | { ok: false; error: string };

/** Browser entry for Accept — keeps the shared secret off the client. */
export async function acceptReceivingWallRecord(input: {
  recordId: string;
  actor?: string;
}): Promise<AcceptReceivingWallResponse> {
  try {
    const data = await handleReceivingWallAccept(input);
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not accept this record.";
    console.error("Receiving Wall accept action failed:", message);
    return { ok: false, error: message };
  }
}
