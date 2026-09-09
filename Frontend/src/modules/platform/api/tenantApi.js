import api from "../../../config/axios";

export const tenantApi = {
  fetchTenants: async (status) => {
    const response = await api.get("/platform/tenants", {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  getTenant: async (id) => {
    const response = await api.get(`/platform/tenants/${id}`);
    return response.data;
  },

  createTenant: async (payload) => {
    const response = await api.post("/platform/tenants", payload);
    return response.data;
  },

  updateTenant: async (id, payload) => {
    const response = await api.put(`/platform/tenants/${id}`, payload);
    return response.data;
  },

  deleteTenant: async (id) => {
    const response = await api.delete(`/platform/tenants/${id}`);
    return response.data;
  },
};
