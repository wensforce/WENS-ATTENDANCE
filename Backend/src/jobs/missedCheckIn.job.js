import { notifyMissedCheckIn } from "../services/missedCheckIn.service.js";

export const runMissedCheckInJob = async ({
  watchDepartment,
  notifyTo,
  slotLabel,
}) => {
  console.log("[cron] missedCheckIn started", slotLabel);
  try {
    const result = await notifyMissedCheckIn({
      watchDepartment,
      notifyTo,
      slotLabel,
    });
    console.log("[cron] missedCheckIn done", result);
  } catch (err) {
    console.error("[cron] missedCheckIn failed", err);
  }
};
