import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";
import { requireTenantId } from "../utils/tenant.js";

export const createBreakConfig = async (req, res) => {
  try {
    const {
      breakType,
      label,
      maxDurationMins,
      maxPerDay,
      isPaid,
      isActive,
      graceMins,
      scope,
      applicableRoles,
      userIds,
    } = req.body;

    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    if (scope === "SPECIFIC_USERS" && !userIds?.length) {
      return responses.badRequest(res, "At least one user ID is required");
    }

    if (scope === "ROLE" && !applicableRoles) {
      return responses.badRequest(res, "Applicable roles are required");
    }

    const breakConfig = await prisma.breakConfig.create({
      data: {
        tenantId,
        breakType,
        label,
        maxDurationMins: parseInt(maxDurationMins),
        maxPerDay: parseInt(maxPerDay),
        isPaid: isPaid === true || isPaid === "true",
        isActive: isActive === true || isActive === "true",
        graceMins: parseInt(graceMins),
        createdBy: req.user.userId,
        scope,
        applicableRoles: applicableRoles ?? null,
      },
    });

    if (scope === "SPECIFIC_USERS") {
      await prisma.userBreakConfig.createMany({
        data:
          userIds?.map((userId) => ({
            tenantId,
            createdBy: req.user.userId,
            userId: parseInt(userId),
            breakConfigId: parseInt(breakConfig.id),
            isAllowed: true,
          })) || [],
        skipDuplicates: true,
      });
    }

    return success(res, 201, "Break config created successfully", {
      breakConfig,
    });
  } catch (error) {
    console.error("Error creating break config:", error);
    if (error.code === "P2002") {
      return responses.badRequest(res, "Break type already exists");
    }
    return responses.serverError(res, "Internal server error");
  }
};

export const getAllBreakConfigs = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const search = String(req.query.search || "").trim();
    const scope = String(req.query.scope || "all");
    const status = String(req.query.status || "all"); // all | active | inactive

    const where = { tenantId };
    const and = [];

    if (search) {
      and.push({
        OR: [
          { breakType: { contains: search } },
          { label: { contains: search } },
        ],
      });
    }

    if (scope && scope !== "all") {
      and.push({ scope });
    }

    if (status === "active") {
      and.push({ isActive: true });
    } else if (status === "inactive") {
      and.push({ isActive: false });
    }

    if (and.length) where.AND = and;

    const totalCount = await prisma.breakConfig.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const breakConfigs = await prisma.breakConfig.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return success(res, 200, "Break configs fetched successfully", {
      breakConfigs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting all break configs:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const getBreakConfigById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const configId = parseInt(id);
    const breakConfig = await prisma.breakConfig.findUnique({
      where: { id: configId, tenantId },
    });

    if (!breakConfig) {
      return responses.notFound(res, "Break config not found");
    }

    const userBreakConfigs = await prisma.userBreakConfig.findMany({
      where: { breakConfigId: configId, tenantId },
      orderBy: { updatedAt: "desc" },
    });

    const userIds = [...new Set(userBreakConfigs.map((u) => u.userId))];
    const usersList =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds }, tenantId },
            select: { id: true, employeeName: true, employeeId: true },
          })
        : [];

    const userMap = Object.fromEntries(usersList.map((u) => [u.id, u]));

    const breakAccess = userBreakConfigs.map((ubc) => ({
      id: ubc.id,
      userId: ubc.userId,
      breakConfigId: ubc.breakConfigId,
      isAllowed: ubc.isAllowed,
      createdAt: ubc.createdAt,
      updatedAt: ubc.updatedAt,
      employeeName: userMap[ubc.userId]?.employeeName ?? null,
      employeeId: userMap[ubc.userId]?.employeeId ?? null,
    }));

    // Allowed users only — used by edit form for SPECIFIC_USERS chips
    const users = breakAccess
      .filter((a) => a.isAllowed)
      .map((a) => ({
        id: a.userId,
        employeeName: a.employeeName,
        employeeId: a.employeeId,
      }));

    return success(res, 200, "Break config fetched successfully", {
      breakConfig,
      userBreakConfigs,
      users,
      breakAccess,
    });
  } catch (error) {
    console.error("Error getting break config by id:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const updateBreakConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      breakType,
      label,
      maxDurationMins,
      maxPerDay,
      isPaid,
      isActive,
      graceMins,
      scope,
      applicableRoles,
      userIds,
    } = req.body;
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const configId = parseInt(id);

    if (scope === "SPECIFIC_USERS" && !userIds?.length) {
      return responses.badRequest(res, "At least one user ID is required");
    }
    if (scope === "ROLE" && !applicableRoles) {
      return responses.badRequest(res, "Applicable roles are required");
    }

    const data = {};
    if (breakType !== undefined) data.breakType = breakType;
    if (label !== undefined) data.label = label;
    if (maxDurationMins !== undefined)
      data.maxDurationMins = parseInt(maxDurationMins);
    if (maxPerDay !== undefined) data.maxPerDay = parseInt(maxPerDay);
    if (isPaid !== undefined)
      data.isPaid = isPaid === true || isPaid === "true";
    if (isActive !== undefined)
      data.isActive = isActive === true || isActive === "true";
    if (graceMins !== undefined) data.graceMins = parseInt(graceMins);
    if (scope !== undefined) data.scope = scope;
    if (applicableRoles !== undefined)
      data.applicableRoles = applicableRoles ?? null;

    const updatedBreakConfig = await prisma.breakConfig.update({
      where: { id: configId, tenantId },
      data,
    });

    // Sync SPECIFIC_USERS assignments when scope/userIds are part of the update
    if (scope === "SPECIFIC_USERS" && Array.isArray(userIds)) {
      await prisma.userBreakConfig.deleteMany({
        where: { breakConfigId: configId, tenantId },
      });
      await prisma.userBreakConfig.createMany({
        data: userIds.map((userId) => ({
          tenantId,
          createdBy: req.user.userId,
          userId: parseInt(userId),
          breakConfigId: configId,
          isAllowed: true,
        })),
        skipDuplicates: true,
      });
    } else if (scope && scope !== "SPECIFIC_USERS") {
      // Clear overrides when leaving SPECIFIC_USERS
      await prisma.userBreakConfig.deleteMany({
        where: { breakConfigId: configId, tenantId },
      });
    }

    return success(res, 200, "Break config updated successfully", {
      updatedBreakConfig,
    });
  } catch (error) {
    console.error("Error updating break config:", error);
    if (error.code === "P2025") {
      return responses.badRequest(res, "Break config is not found");
    }
    if (error.code === "P2002") {
      return responses.badRequest(res, "Break config already exists");
    }
    return responses.serverError(res, "Internal server error");
  }
};

export const deleteBreakConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    // soft delete the break config
    await prisma.breakConfig.update({
      where: { id: parseInt(id), tenantId },
      data: {
        isActive: false,
      },
    });

    return success(res, 200, "Break config deleted successfully");
  } catch (error) {
    console.error("Error deleting break config:", error);
    if (error.code === "P2025") {
      return responses.badRequest(res, "Break config is not found");
    }
    return responses.serverError(res, "Internal server error");
  }
};

export const getBreakAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const breakAccess = await prisma.userBreakConfig.findMany({
      where: {
        tenantId,
        userId: parseInt(userId),
      },
      include: {
        breakConfig: {
          select: {
            label: true,
            breakType: true,
            maxDurationMins: true,
            maxPerDay: true,
            isPaid: true,
            isActive: true,
            graceMins: true,
            scope: true,
          },
        },
      },
    });
    return success(res, 200, "Break access fetched successfully", {
      breakAccess,
    });
  } catch (error) {
    console.error("Error getting break access:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const setOrUpdateBreakAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { breakConfigId, isAllowed } = req.body;
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const allowed = isAllowed === true || isAllowed === "true";

    const newBreakAccess = await prisma.userBreakConfig.upsert({
      where: {
        userId_breakConfigId: {
          userId: parseInt(userId),
          breakConfigId: parseInt(breakConfigId),
        },
      },
      update: {
        isAllowed: allowed,
      },
      create: {
        tenantId,
        createdBy: req.user.userId,
        userId: parseInt(userId),
        breakConfigId: parseInt(breakConfigId),
        isAllowed: allowed,
      },
    });

    const user = await prisma.user.findFirst({
      where: { id: parseInt(userId), tenantId },
      select: { id: true, employeeName: true, employeeId: true },
    });

    return success(res, 200, "Break access updated successfully", {
      newBreakAccess: {
        ...newBreakAccess,
        employeeName: user?.employeeName ?? null,
        employeeId: user?.employeeId ?? null,
      },
    });
  } catch (error) {
    console.error("Error setting update break access:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export default {
  createBreakConfig,
  getAllBreakConfigs,
  getBreakConfigById,
  updateBreakConfig,
  deleteBreakConfig,
  getBreakAccess,
  setOrUpdateBreakAccess,
};
