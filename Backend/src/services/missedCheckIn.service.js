import prisma from "../../lib/prisma.js";
import {
  getStartOfDay,
  getEndOfDay,
  isTodayWeekOff,
} from "../utils/dateFormat.js";
import { sendTemplate } from "./doubletick.service.js";
import sendNotification from "./sendNotification.js";

export const notifyMissedCheckIn = async ({
  watchDepartment,
  notifyTo,
  slotLabel,
}) => {
  const tenantId = Number(process.env.MISSED_CHECKIN_TENANT_ID);
  const templateName = process.env.DOUBLETICK_TEMPLATE_NAME;

  if (!tenantId || !templateName || !watchDepartment || !notifyTo?.length) {
    console.error("[missedCheckIn] missing tenant, template, or departments");
    return { sent: 0 };
  }

  const dayStart = getStartOfDay(new Date());
  const dayEnd = getEndOfDay(new Date());

  const watchDept = await prisma.department.findFirst({
    where: { tenantId, name: watchDepartment },
  });

  if (!watchDept) {
    console.error("[missedCheckIn] department not found", watchDepartment);
    return { sent: 0 };
  }

  const [watchedUsers, onLeave, recipients] = await Promise.all([
    prisma.user.findMany({
      where: {
        tenantId,
        departmentId: watchDept.id,
        userType: { in: ["EMPLOYEE", "BODYGUARD"] },
      },
      select: {
        id: true,
        employeeName: true,
        shift: true,
        weekendOff: true,
        joinDate: true,
      },
    }),
    prisma.leaveEmployee.findMany({
      where: {
        leave: {
          tenantId,
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart },
        },
      },
      select: { employeeId: true },
    }),
    prisma.user.findMany({
      where: {
        tenantId,
        mobileNumber: { not: "" },
        OR: [
          { department: { name: { in: notifyTo } } },
          { designation: { name: { in: notifyTo } } },
        ],
      },
      select: { mobileNumber: true, deviceId: true },
    }),
  ]);

  const checkedIn = await prisma.attendance.findMany({
    where: {
      tenantId,
      userId: { in: watchedUsers.map((u) => u.id) },
      date: { gte: dayStart, lte: dayEnd },
      checkInTime: { not: null },
    },
    select: { userId: true },
  });

  const checkedInIds = new Set(checkedIn.map((a) => a.userId));
  const onLeaveIds = new Set(onLeave.map((l) => l.employeeId));

  const missing = watchedUsers.filter((u) => {
    const shiftStart = (u.shift || "").split(" - ")[0].trim();
    if (!shiftStart.startsWith("11:00")) return false;
    if (checkedInIds.has(u.id)) return false;
    if (onLeaveIds.has(u.id)) return false;
    if (isTodayWeekOff(u.weekendOff, dayStart.getDay())) return false;
    if (u.joinDate && getStartOfDay(u.joinDate) > dayStart) return false;
    return true;
  });

  const mobiles = [
    ...new Set(recipients.map((u) => u.mobileNumber).filter(Boolean)),
  ];

  if (missing.length === 0 || mobiles.length === 0) {
    return { missing: missing.length, sent: 0 };
  }

  const names = missing
    .map((u) => u.employeeName)
    .filter(Boolean)
    .join(", ");

  for (const mobile of mobiles) {
    await sendTemplate(mobile, templateName, [
      names,
      slotLabel,
      slotLabel === "11:25 AM" ? "2nd" : "1st",
    ]);
  }

  const tokens = recipients.map((u) => u.deviceId).filter(Boolean);
  if (tokens.length > 0) {
    sendNotification(
      tokens,
      "Missed Check-in",
      `${names} has missed the check-in for ${slotLabel}.`,
    );
  }

  return { missing: missing.length, sent: mobiles.length };
};
