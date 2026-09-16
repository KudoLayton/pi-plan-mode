import { randomUUID } from "node:crypto";
import { lstat, mkdir, rename, rm, rmdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

async function exists(path) {
  try { await lstat(path); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

// Only the distribution startup path calls this; settings readers remain read-only.
// The lock coordinates these initializers across processes, not arbitrary external editors.
export async function initializeSettings(agentDir, profile, signal) {
  const target = join(agentDir, profile.file);
  const legacy = profile.legacy?.map((name) => join(agentDir, name)) ?? [];
  const configured = async () => {
    for (const path of [target, ...legacy]) if (await exists(path)) return true;
    return false;
  };
  signal?.throwIfAborted();
  if (await configured()) return false;
  await mkdir(agentDir, { recursive: true });
  const lock = `${target}.initializing`;
  const deadline = Date.now() + 3000;
  while (true) {
    signal?.throwIfAborted();
    try { await mkdir(lock); break; }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      if (await configured()) return false;
      if (Date.now() >= deadline) {
        throw new Error(`Settings initialization is locked: ${lock}. Close other Pi processes; remove this empty lock directory only if a previous initialization crashed.`);
      }
      await delay(25, undefined, { signal });
    }
  }
  const temporary = join(agentDir, `.${profile.file}.${randomUUID()}.tmp`);
  try {
    if (await configured()) return false;
    signal?.throwIfAborted();
    await writeFile(temporary, `${JSON.stringify(profile.settings, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    signal?.throwIfAborted();
    if (await configured()) return false;
    await rename(temporary, target);
    return true;
  } finally {
    await rm(temporary, { force: true });
    // Never recursively delete a lock or a user-provided settings path.
    await rmdir(lock);
  }
}

export function withInitialSettings(factory, getAgentDir, profile) {
  return (pi) => {
    let lifecycle = new AbortController();
    pi.on("session_start", () => {
      lifecycle.abort();
      lifecycle = new AbortController();
    });
    pi.on("session_shutdown", () => lifecycle.abort());
    // Retain the public API and intercept only session_start registration. Each
    // original handler initializes before it reads settings, regardless of load order.
    const api = Object.create(pi);
    api.on = (event, handler) => pi.on(event, event === "session_start"
      ? async (payload, ctx) => {
          const signal = ctx.signal ? AbortSignal.any([lifecycle.signal, ctx.signal]) : lifecycle.signal;
          try {
            await initializeSettings(getAgentDir(), profile, signal);
          } catch (error) {
            if (signal.aborted) return;
            throw error;
          }
          if (signal.aborted) return;
          return handler(payload, ctx);
        }
      : handler);
    return factory(api);
  };
}
