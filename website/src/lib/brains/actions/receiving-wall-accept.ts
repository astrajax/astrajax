"use server";

import { headers } from "next/headers";
import { assertDocPromoteAuthorized } from "../http";
import {
  handleReceivingWallAccept,
  type ReceivingWallAcceptResult,
} from "../handlers/receiving-wall-accept";

/** Browser entry for Accept — same promote authorization as the API route. */
export async function acceptReceivingWallRecord(input: {
  recordId: string;
  actor?: string;
}): Promise<ReceivingWallAcceptResult> {
  const headerStore = await headers();
  assertDocPromoteAuthorized(headerStore.get("x-brain-doc-promote"));
  return handleReceivingWallAccept(input);
}
