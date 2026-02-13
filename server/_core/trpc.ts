// Simplified tRPC setup for desktop app - no authentication
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// For backward compatibility, protectedProcedure is same as publicProcedure in desktop app
export const protectedProcedure = publicProcedure;
export const adminProcedure = publicProcedure;
