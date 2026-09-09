import cron from "node-cron";
import { runMarkAbsentsJob } from "./markAbsents.job.js";

export const startJobs = () => {
  // TEMP TEST: 16:20 IST — change back to "10 0 * * *" after testing
  cron.schedule(
    "20 16 * * *",
    () => {
      runMarkAbsentsJob();
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("[cron] jobs registered (markAbsents @ 16:20 Asia/Kolkata — TEST)");
};
