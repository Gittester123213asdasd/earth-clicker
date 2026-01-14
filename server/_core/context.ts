import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { sdk } from "./sdk";

// We keep the type flexible so it doesn't crash if the SQLite file is missing
export type TrpcContext = {
  req: any;
  res: any;
  user: any;
};

export async function createContext(
  opts: CreateNextContextOptions
): Promise<TrpcContext> {
  let user = null;

  try {
    // This still uses your Manus SDK to check who is clicking
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
