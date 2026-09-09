import prisma from "../../lib/prisma.js";
import { responses } from "./response.js";

export const requireTenantId = (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    responses.unauthorized(res, "Tenant not assigned");
    return null;
  }
  return tenantId;
};

export const isBodyguardEnabledForTenant = async (tenantId) => {
  if (!tenantId) return false;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { bodyguardEnabled: true },
  });
  return Boolean(tenant?.bodyguardEnabled);
};

export const requireBodyguardEnabled = async (req, res) => {
  const tenantId = requireTenantId(req, res);
  if (!tenantId) return null;
  const enabled = await isBodyguardEnabledForTenant(tenantId);
  if (!enabled) {
    responses.forbidden(res, "Bodyguard service is not enabled for this company");
    return null;
  }
  return tenantId;
};
