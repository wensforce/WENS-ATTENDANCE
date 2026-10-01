import prisma from "../../lib/prisma.js";
import {
  getStartOfDay,
  getEndOfDay,
  isTodayWeekOff,
} from "../utils/dateFormat.js";

/**
 * Insert ABSENT rows for users with no attendance on a given past day (one tenant).
 * Skips week-off, not-yet-joined, and users on LEAVE/HOLIDAY for that day.
 * Rows have null checkInTime so they do not count as present.
 */
export const ensureAbsentRowsForDay = async (tenantId, dayStart) => {
  const dayEnd = getEndOfDay(dayStart);

  const [users, existing, onLeave] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId },
      select: { id: true, weekendOff: true, joinDate: true },
    }),
    prisma.attendance.findMany({
      where: {
        tenantId,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { userId: true },
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
  ]);

  const hasRecord = new Set(existing.map((a) => a.userId));
  const onLeaveSet = new Set(onLeave.map((l) => l.employeeId));

  const toCreate = users
    .filter((u) => !hasRecord.has(u.id))
    .filter((u) => !onLeaveSet.has(u.id))
    .filter((u) => !u.joinDate || getStartOfDay(u.joinDate) <= dayStart)
    .filter((u) => !isTodayWeekOff(u.weekendOff, dayStart.getDay()))
    .map((u) => ({
      userId: u.id,
      tenantId,
      date: dayStart,
      status: "ABSENT",
    }));

  if (toCreate.length > 0) {
    await prisma.attendance.createMany({ data: toCreate });
  }

  return toCreate.length;
};

/** Mark absents for yesterday across all active tenants. */
export const markYesterdayAbsentsForAllTenants = async () => {
  const yesterday = getStartOfDay(new Date());
  yesterday.setDate(yesterday.getDate() - 1);

  const tenants = await prisma.tenant.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  let created = 0;
  for (const tenant of tenants) {
    created += await ensureAbsentRowsForDay(tenant.id, yesterday);
  }

  return {
    date: yesterday,
    created,
    tenants: tenants.length,
  };
};
