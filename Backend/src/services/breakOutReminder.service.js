import prisma from "../../lib/prisma.js";
import sendNotification from "./sendNotification.js";

const REMIND_BEFORE_MS = 1 * 60 * 1000;

const breakOutReminder = ({ deviceId, breakRecord, breakConfig }) => {
  if (!deviceId) return;

  const allowedMs = breakConfig.maxDurationMins * 60 * 1000;

  const delay =
    new Date(breakRecord.startTime).getTime() +
    allowedMs -
    REMIND_BEFORE_MS -
    Date.now();

  if (delay <= 0) return;

  setTimeout(async () => {
    try {
      const openBreak = await prisma.break.findUnique({
        where: { id: breakRecord.id },
      });

      if (!openBreak || openBreak.endTime) return;

      sendNotification(
        [deviceId],
        "Break out reminder",
        `You have ${REMIND_BEFORE_MS / 60000} minutes left to break out`,
      );
    } catch (err) {
      console.error("[breakOutReminder] failed", err);
    }
  }, delay);
};

export default breakOutReminder;
