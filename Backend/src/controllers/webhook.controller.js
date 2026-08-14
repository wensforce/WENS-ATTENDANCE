import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";

export const createWebhook = async (req, res) => {
  try {
    const { event, url } = req.body;

    if (!event || !url) {
      return responses.badRequest(res, "Event and URL are required.");
    }

    const newWebhook = await prisma.webhook.create({
      data: {
        eventType: event,
        url,
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
    const webhooks = await prisma.webhook.findMany();
    return success(res, 200, "Webhooks fetched successfully", webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return responses.serverError(res, "Failed to fetch webhooks.");
  }
};

export const deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return responses.badRequest(res, "Webhook ID is required.");
    }

    const deletedWebhook = await prisma.webhook.delete({
      where: { id: parseInt(id) },
    });

    return responses.deleted(res);
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return responses.serverError(res, "Failed to delete webhook.");
  }
};

export const updateWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const { event, url } = req.body;

    if (!id) {
      return responses.badRequest(res, "Webhook ID is required.");
    }

    if (!event || !url) {
      return responses.badRequest(res, "Event and URL are required.");
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id: parseInt(id) },
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
