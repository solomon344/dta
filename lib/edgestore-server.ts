import "server-only";
import { initEdgeStore } from "@edgestore/server";
import {
  type CreateContextOptions,
  createEdgeStoreNextHandler,
} from "@edgestore/server/adapters/next/app";
import { z } from "zod";
import { auth } from "./auth";

type Context = {
  userId: string;
  role: "admin" | "staff" | "anonymous";
};

async function createContext({ req }: CreateContextOptions): Promise<Context> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return { userId: "", role: "anonymous" };
  return { userId: session.user.id, role: session.user.role === "admin" ? "admin" : "staff" };
}

/** Staff may manage their own files; admins may manage anyone's. */
function canManage(ctx: Context, ownerId: string) {
  return ctx.role === "admin" || (ctx.role === "staff" && ctx.userId === ownerId);
}

const es = initEdgeStore.context<Context>().create();

export const edgeStoreRouter = es.router({
  /**
   * Staff photos and digital signatures. Public, because signatures are printed
   * on certificates that anyone can view on the verification page.
   */
  staffImages: es
    .imageBucket({
      maxSize: 1024 * 1024 * 5,
      accept: ["image/png", "image/jpeg", "image/webp"],
    })
    .input(z.object({ ownerId: z.string().min(1), kind: z.enum(["photo", "signature"]) }))
    .path(({ input }) => [{ owner: input.ownerId }, { kind: input.kind }])
    .beforeUpload(({ ctx, input }) => canManage(ctx, input.ownerId))
    .beforeDelete(({ ctx, fileInfo }) => canManage(ctx, String(fileInfo.path.owner))),

  /** Private staff documents (contracts, CVs, IDs). Only the owner and admins can open them. */
  staffDocuments: es
    .fileBucket({ maxSize: 1024 * 1024 * 20 })
    .input(z.object({ ownerId: z.string().min(1) }))
    .path(({ input }) => [{ owner: input.ownerId }])
    .accessControl({
      OR: [{ userId: { path: "owner" } }, { role: { eq: "admin" } }],
    })
    .beforeUpload(({ ctx, input }) => canManage(ctx, input.ownerId))
    .beforeDelete(({ ctx, fileInfo }) => canManage(ctx, String(fileInfo.path.owner))),
});

export const edgeStoreHandler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
  createContext,
});

/** Backend client. Created on first use so builds don't need EdgeStore keys. */
export function edgeStoreBackend() {
  return edgeStoreRouter.client;
}

export type EdgeStoreRouter = typeof edgeStoreRouter;

/**
 * Basic shape check for file URLs posted to server actions. The file host varies by
 * EdgeStore project, so ownership is verified by `confirm()` on the target bucket,
 * which fails for any file that wasn't uploaded to that bucket.
 */
export function isEdgeStoreUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
