import prisma from "../../lib/prisma.js";
import { getEndOfDay, getStartOfDay } from "../utils/dateFormat.js";

export async function isBreakAllowedForUser(userId, userRole, breakConfig) {
  if (!breakConfig.isActive) return false;

  const override = await prisma.userBreakConfig.findUnique({
    where: {
      userId_breakConfigId: {
        userId,
        breakConfigId: breakConfig.id,
      },
    },
  });

  if (override) return override.isAllowed; // explicit override always wins

  if (breakConfig.scope === "ALL") return true;
  if (breakConfig.scope === "ROLE") {
    return JSON.parse(breakConfig.applicableRoles || "[]").includes(userRole);
  }
  if (breakConfig.scope === "SPECIFIC_USERS") return false; // no row = not allowed

  return false;
}

/** Attach today's usage + alreadyTaken flag to a config. */
const withDailyUsage = (config, usedToday = 0) => {
  const maxPerDay = config.maxPerDay ?? 1;
  const alreadyTaken = usedToday >= maxPerDay;

  return {
    ...config,
    usedToday,
    remaining: Math.max(0, maxPerDay - usedToday),
    alreadyTaken,
    statusMessage: alreadyTaken ? "Already taken" : null,
  };
};

/**
 * Allowed break options for a user:
 * - ALL scope (minus blocked overrides)
 * - SPECIFIC_USERS where isAllowed
 * Plus today's usage (usedToday / alreadyTaken).
 */
export async function resolveBreakOptionsForUser(tenantId, userId) {
  const [overrides, allScopeConfigs] = await Promise.all([
    prisma.userBreakConfig.findMany({
      where: {
        tenantId,
        userId,
        breakConfig: { isActive: true },
      },
      include: { breakConfig: true },
    }),
    prisma.breakConfig.findMany({
      where: { tenantId, scope: "ALL", isActive: true },
    }),
  ]);

  const blockedAllIds = new Set(
    overrides
      .filter((o) => o.breakConfig.scope === "ALL" && o.isAllowed === false)
      .map((o) => o.breakConfigId),
  );

  const specificAllowed = overrides
    .filter(
      (o) =>
        o.breakConfig.scope === "SPECIFIC_USERS" && o.isAllowed === true,
    )
    .map((o) => o.breakConfig);

  const configs = [
    ...allScopeConfigs.filter((c) => !blockedAllIds.has(c.id)),
    ...specificAllowed,
  ];

  if (!configs.length) return [];

  const usageRows = await prisma.break.groupBy({
    by: ["breakConfigId"],
    where: {
      tenantId,
      userId,
      breakConfigId: { in: configs.map((c) => c.id) },
      startTime: {
        gte: getStartOfDay(new Date()),
        lte: getEndOfDay(new Date()),
      },
    },
    _count: { _all: true },
  });

  const usedTodayById = new Map(
    usageRows.map((row) => [row.breakConfigId, row._count._all]),
  );

  return configs.map((config) =>
    withDailyUsage(config, usedTodayById.get(config.id) || 0),
  );
}
