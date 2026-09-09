import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";
import { requireTenantId } from "../utils/tenant.js";

export const createWebhook = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { event, url } = req.body;

    if (!event || !url) {
      return responses.badRequest(res, "Event and URL are required.");
    }

    const newWebhook = await prisma.webhook.create({
      data: {
        eventType: event,
        url,
        tenantId,
      },
    });

    return responses.created(res, newWebhook);
  } catch (error) {
    console.error("Error creating webhook:", error);
    return responses.serverError(res, "Failed to create webhook.");
  }
};

export const getWebhooks = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const webhooks = await prisma.webhook.findMany({
      where: { tenantId },
    });
    return success(res, 200, "Webhooks fetched successfully", webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return responses.serverError(res, "Failed to fetch webhooks.");
  }
};

export const deleteWebhook = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;

    if (!id) {
      return responses.badRequest(res, "Webhook ID is required.");
    }

    const deleted = await prisma.webhook.deleteMany({
      where: { id: parseInt(id), tenantId },
    });
    if (deleted.count === 0) {
      return responses.notFound(res, "Webhook not found");
    }

    return responses.deleted(res);
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return responses.serverError(res, "Failed to delete webhook.");
  }
};

export const updateWebhook = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const { event, url } = req.body;

    if (!id) {
      return responses.badRequest(res, "Webhook ID is required.");
    }

    if (!event || !url) {
      return responses.badRequest(res, "Event and URL are required.");
    }

    const existing = await prisma.webhook.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!existing) {
      return responses.notFound(res, "Webhook not found");
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id: existing.id },
      data: {
        eventType: event,
        url,
      },
    });

    return responses.updated(res, updatedWebhook);
  } catch (error) {
    console.error("Error updating webhook:", error);
    return responses.serverError(res, "Failed to update webhook.");
  }
};
