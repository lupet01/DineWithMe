import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

/**
 * Serves every registered Inngest function at this one route. In dev, the
 * Inngest Dev Server (`npx inngest-cli dev`) discovers this automatically -
 * no INNGEST_EVENT_KEY/INNGEST_SIGNING_KEY needed locally, those are for
 * production only.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
