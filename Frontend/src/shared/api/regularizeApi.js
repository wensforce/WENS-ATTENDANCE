import api from "../../config/axios";

export const regularizeApi = {
  create: async (payload) => {
    const response = await api.post("/regularize", payload);
    return response.data;
  },

  list: async (params = {}) => {
    const response = await api.get("/regularize", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/regularize/${id}`);
    return response.data;
  },

  approve: async (id, payload = {}) => {
    const response = await api.patch(`/regularize/${id}/approve`, payload);
    return response.data;
  },

  reject: async (id, payload = {}) => {
    const response = await api.patch(`/regularize/${id}/reject`, payload);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/regularize/${id}`);
    return response.data;
  },
};
