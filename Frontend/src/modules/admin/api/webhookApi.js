import api from "../../../config/axios";

export const useWebhookApi = {
    fetchWebhook: async () => {
        try {
            const response = await api.get("/webhook/all");
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    createWebhook: async (webhookData) => {
        try {
            const response = await api.post("/webhook/create", webhookData);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    updateWebhook: async (webhookId, webhookData) => {
        try {
            const response = await api.put(`/webhook/update/${webhookId}`, webhookData);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    deleteWebhook: async (webhookId) => {
        try {
            const response = await api.delete(`/webhook/delete/${webhookId}`);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
};
