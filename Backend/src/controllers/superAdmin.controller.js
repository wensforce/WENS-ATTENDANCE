import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";
import bcrypt from "bcryptjs";
import {
  generateWelcomeEmail,
  sendEmail,
} from "../services/mail.service.js";

const toSlug = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureUniqueSlug = async (baseSlug, excludeId) => {
  let slug = baseSlug || "tenant";
  let suffix = 1;
  while (true) {
    const existing = await prisma.tenant.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
};

const ensureAttendanceSetting = async (tx, tenantId) => {
  const client = tx || prisma;
  const existing = await client.attendanceSetting.findFirst({
    where: { tenantId },
  });
  if (!existing) {
    await client.attendanceSetting.create({ data: { tenantId } });
  }
};

const findExistingLogin = async (email, mobileNumber) => {
  return prisma.user.findFirst({
    where: {
      OR: [{ email }, { mobileNumber }],
    },
  });
};

const createTenantAdmin = async (tx, tenantId, admin) => {
  const email = admin.email.trim();
  const mobileNumber = String(admin.mobileNumber).trim();
  const employeeName = admin.employeeName.trim();
  const employeeId = admin.employeeId?.trim() || "ADMIN";

  const tempPin = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedPin = await bcrypt.hash(tempPin, 10);

  const user = await tx.user.create({
    data: {
      email,
      mobileNumber,
      employeeName,
      employeeId,
      userType: "ADMIN",
      pin: hashedPin,
      tenantId,
    },
  });

  return { user, tempPin };
};

const tenantListSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  bodyguardEnabled: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { users: true },
  },
  users: {
    where: { userType: "ADMIN" },
    select: {
      id: true,
      employeeName: true,
      email: true,
      mobileNumber: true,
      employeeId: true,
      userType: true,
    },
  },
};

export const createTenant = async (req, res) => {
  try {
    const { name, slug, status = "active", admin, bodyguardEnabled = false } = req.body;

    const existingLogin = await findExistingLogin(
      admin.email.trim(),
      String(admin.mobileNumber).trim(),
    );
    if (existingLogin) {
      return responses.conflict(
        res,
        "User with this email or mobile number already exists",
      );
    }

    const uniqueSlug = await ensureUniqueSlug(toSlug(slug || name));

    const { tenant, adminUser, tempPin } = await prisma.$transaction(
      async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: name.trim(),
            slug: uniqueSlug,
            status,
            bodyguardEnabled: Boolean(bodyguardEnabled),
          },
        });
        await ensureAttendanceSetting(tx, tenant.id);
        const { user, tempPin } = await createTenantAdmin(
          tx,
          tenant.id,
          admin,
        );
        return { tenant, adminUser: user, tempPin };
      },
    );

    const mailContent = generateWelcomeEmail(
      adminUser.employeeName,
      adminUser.mobileNumber,
      tempPin,
    );
    sendEmail(
      adminUser.email,
      "Welcome to WENS Attendance - Your Account Details",
      mailContent,
    );

    return responses.created(res, {
      tenant,
      admin: {
        id: adminUser.id,
        employeeName: adminUser.employeeName,
        email: adminUser.email,
        mobileNumber: adminUser.mobileNumber,
        employeeId: adminUser.employeeId,
        userType: adminUser.userType,
        pin: tempPin,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return responses.conflict(
        res,
        "Tenant slug or admin employee ID already exists",
      );
    }
    console.error("Create tenant error:", error);
    return responses.serverError(res, "Failed to create tenant");
  }
};

export const getTenants = async (req, res) => {
  try {
    const status = req.query.status;
    const tenants = await prisma.tenant.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      select: tenantListSelect,
    });
    return success(res, 200, "Tenants retrieved successfully", { tenants });
  } catch (error) {
    console.error("Get tenants error:", error);
    return responses.serverError(res, "Failed to fetch tenants");
  }
};

export const getTenantById = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: parseInt(req.params.id) },
      select: tenantListSelect,
    });
    if (!tenant) {
      return responses.notFound(res, "Tenant not found");
    }
    return success(res, 200, "Tenant retrieved successfully", { tenant });
  } catch (error) {
    console.error("Get tenant error:", error);
    return responses.serverError(res, "Failed to fetch tenant");
  }
};

export const updateTenant = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      return responses.notFound(res, "Tenant not found");
    }

    const data = {};
    if (req.body.name) data.name = req.body.name.trim();
    if (req.body.status) data.status = req.body.status;
    if (typeof req.body.bodyguardEnabled === "boolean") {
      data.bodyguardEnabled = req.body.bodyguardEnabled;
    }
    if (req.body.slug || req.body.name) {
      data.slug = await ensureUniqueSlug(
        toSlug(req.body.slug || req.body.name || existing.slug),
        id,
      );
    }

    if (req.body.admin) {
      const userCount = await prisma.user.count({ where: { tenantId: id } });
      if (userCount === 0) {
        const existingLogin = await findExistingLogin(
          req.body.admin.email.trim(),
          String(req.body.admin.mobileNumber).trim(),
        );
        if (existingLogin) {
          return responses.conflict(
            res,
            "User with this email or mobile number already exists",
          );
        }
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data,
    });

    if (tenant.status === "active") {
      await ensureAttendanceSetting(prisma, tenant.id);
    }

    let adminUser = null;
    let tempPin = null;
    if (req.body.admin) {
      const userCount = await prisma.user.count({ where: { tenantId: id } });
      if (userCount === 0) {
        const existingLogin = await findExistingLogin(
          req.body.admin.email.trim(),
          String(req.body.admin.mobileNumber).trim(),
        );
        if (existingLogin) {
          return responses.conflict(
            res,
            "User with this email or mobile number already exists",
          );
        }
        const created = await prisma.$transaction(async (tx) => {
          return createTenantAdmin(tx, id, req.body.admin);
        });
        adminUser = created.user;
        tempPin = created.tempPin;
        const mailContent = generateWelcomeEmail(
          adminUser.employeeName,
          adminUser.mobileNumber,
          tempPin,
        );
        sendEmail(
          adminUser.email,
          "Welcome to WENS Attendance - Your Account Details",
          mailContent,
        );
      }
    }

    return responses.updated(res, {
      tenant,
      ...(adminUser
        ? {
            admin: {
              id: adminUser.id,
              employeeName: adminUser.employeeName,
              email: adminUser.email,
              mobileNumber: adminUser.mobileNumber,
              employeeId: adminUser.employeeId,
              userType: adminUser.userType,
              pin: tempPin,
            },
          }
        : {}),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return responses.conflict(res, "Tenant slug already exists");
    }
    console.error("Update tenant error:", error);
    return responses.serverError(res, "Failed to update tenant");
  }
};

export const deleteTenant = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) {
      return responses.notFound(res, "Tenant not found");
    }
    if (existing._count.users > 0) {
      const tenant = await prisma.tenant.update({
        where: { id },
        data: { status: "inactive" },
      });
      return success(
        res,
        200,
        "Tenant has users so it was set to inactive instead of deleted",
        { tenant },
      );
    }

    await prisma.attendanceSetting.deleteMany({ where: { tenantId: id } });
    await prisma.tenant.delete({ where: { id } });
    return responses.deleted(res);
  } catch (error) {
    console.error("Delete tenant error:", error);
    return responses.serverError(res, "Failed to delete tenant");
  }
};
