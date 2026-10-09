import cron from "node-cron";
import { runMarkAbsentsJob } from "./markAbsents.job.js";
import { runMissedCheckInJob } from "./missedCheckIn.job.js";

export const startJobs = () => {
  cron.schedule(
    "20 0 * * *",
    () => {
      runMarkAbsentsJob();
    },
    { timezone: "Asia/Kolkata" },
  );

  cron.schedule(
    "20 11 * * *",
    () => runMissedCheckInJob({ watchDepartment: "Sales", notifyTo: ["Deputy Executive Assistant"], slotLabel: "11:20 AM" }),
    { timezone: "Asia/Kolkata" },
  );

  cron.schedule(
    "25 11 * * *",
    () => runMissedCheckInJob({ watchDepartment: "Sales", notifyTo: ["HR"], slotLabel: "11:25 AM" }),
    { timezone: "Asia/Kolkata" },
  );

  console.log(
    "[cron] jobs registered (markAbsents @ 00:20 Asia/Kolkata — TEST, missedCheckIn @ 11:20 Asia/Kolkata — TEST)",
  );
};
