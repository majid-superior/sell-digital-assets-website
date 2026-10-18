// src/config/zod.ts
import { z } from "zod";

/**
 * Configure Zod v4 for strict Content Security Policy (CSP) environments.
 *
 * In strict CSP environments where `script-src` does not permit `'unsafe-eval'`,
 * Zod v4's default JIT feature detection (`new Function("")`) triggers a
 * `securitypolicyviolation` event.
 *
 * Enabling `jitless: true` disables JIT compilation and avoids the `new Function("")`
 * probe entirely, relying on standard interpreted parsing.
 */
z.config({
  jitless: true,
});

export { z };

