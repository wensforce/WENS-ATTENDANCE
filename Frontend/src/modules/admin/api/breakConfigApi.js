import api from "../../../config/axios";

/**
 * Admin break-config APIs
 * Base: /admin/break-config
 */
export const breakConfigApi = {
  /**
   * List configs with filters + pagination
   * GET /admin/break-config
   */
  fetchAll: async ({
    page = 1,
    limit = 10,
    search = "",
    scope = "all",
    status = "all",
  } = {}) => {
    const params = { page, limit };
    if (search) params.search = search;
    if (scope && scope !== "all") params.scope = scope;
    if (status && status !== "all") params.status = status;

    const response = await api.get("/admin/break-config", { params });
    return response.data;
  },

  /**
   * GET /admin/break-config/:id
   */
  getById: async (id) => {
    const response = await api.get(`/admin/break-config/${id}`);
    return response.data;
  },

  /**
   * POST /admin/break-config
   */
  create: async (payload) => {
    const response = await api.post("/admin/break-config", payload);
    return response.data;
  },

  /**
   * PUT /admin/break-config/:id
   */
  update: async (id, payload) => {
    const response = await api.put(`/admin/break-config/${id}`, payload);
    return response.data;
  },

  /**
   * Soft delete (isActive=false)
   * DELETE /admin/break-config/:id
   */
  remove: async (id) => {
    const response = await api.delete(`/admin/break-config/${id}`);
    return response.data;
  },

  /**
   * GET /admin/break-config/access/:userId
   * All break-access overrides for one employee
   */
  getAccessByUser: async (userId) => {
    const response = await api.get(`/admin/break-config/access/${userId}`);
    return response.data;
  },

  /**
   * PUT /admin/break-config/access/:userId
   * Upsert allow/block for a user + breakConfig
   */
  setAccess: async (userId, { breakConfigId, isAllowed }) => {
    const response = await api.put(`/admin/break-config/access/${userId}`, {
      breakConfigId,
      isAllowed,
    });
    return response.data;
  },
};
