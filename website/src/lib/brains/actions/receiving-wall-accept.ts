"use server";

import {
  handleReceivingWallAccept,
  type ReceivingWallAcceptResult,
} from "../handlers/receiving-wall-accept";

/** Browser entry for Accept — keeps the shared secret off the client. */
export async function acceptReceivingWallRecord(input: {
  recordId: string;
  actor?: string;
}): Promise<ReceivingWallAcceptResult> {
  return handleReceivingWallAccept(input);
}
