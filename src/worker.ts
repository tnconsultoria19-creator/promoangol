import { apiRouter } from "./api/router";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return apiRouter(request, env);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    switch (controller.cron) {
      case "0 * * * *":
        await processScheduledOperations(env);
        break;
      default:
        console.log("Unknown cron trigger", controller.cron);
    }
  },
};

async function processScheduledOperations(env: Env): Promise<void> {
  // This is deliberately deterministic and database-driven.
  // The next implementation pass will:
  // 1) release verified rewards whose release_at has passed;
  // 2) expire points whose expiry date has arrived;
  // 3) expire unused redemption approvals;
  // 4) advance eligible transfer requests after the 3-working-day hold;
  // 5) write immutable ledger/audit entries for every state transition.
  //
  // Cron Triggers run on UTC. Store all server timestamps in UTC.
  await env.PROMOANGOL_DB.prepare(`
    INSERT INTO system_jobs (id, job_type, started_at, status)
    VALUES (lower(hex(randomblob(16))), 'HOURLY_OPERATIONS', datetime('now'), 'COMPLETED')
  `).run();
}
