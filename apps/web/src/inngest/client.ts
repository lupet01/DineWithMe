import { EventSchemas, Inngest } from "inngest";

/**
 * Job queue client. Solves the problem Vercel Cron structurally can't:
 * "notify this specific user in exactly 30 minutes" needs a real delayed
 * job, not a bigger poll interval. See dinner-reminder-30-min.ts for the
 * concrete case this unblocks.
 *
 * In dev, the Inngest Dev Server auto-discovers functions served from
 * /api/inngest with zero keys required. INNGEST_EVENT_KEY/
 * INNGEST_SIGNING_KEY are production-only.
 */
type Events = {
  "seat/confirmed": {
    data: {
      seatId: string;
      dinnerId: string;
      userId: string;
    };
  };
};

export const inngest = new Inngest({
  id: "dinewithme",
  schemas: new EventSchemas().fromRecord<Events>(),
});
