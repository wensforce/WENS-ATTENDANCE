import { markYesterdayAbsentsForAllTenants } from "../services/absent.service.js";

export const runMarkAbsentsJob = async () => {
  console.log("[cron] markAbsents started");
  try {
    const result = await markYesterdayAbsentsForAllTenants();
    console.log("[cron] markAbsents done:", result);
  } catch (err) {
    console.error("[cron] markAbsents failed:", err);
  }
};
