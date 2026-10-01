import api from "../../../config/axios";

export const breakApi = {
  /**
   * Admin: list all breaks with filters + pagination
   * GET /break/admin/all
   */
  fetchAllBreaks: async ({
    page = 1,
    limit = 10,
    search = "",
    userId = "",
    date = "",
    type = "all",
    overLimit = "all",
  } = {}) => {
    const params = { page, limit };
    if (search) params.search = search;
    if (userId) params.userId = userId;
    if (date) params.date = date;
    if (type && type !== "all") params.type = type;
    if (overLimit && overLimit !== "all") params.overLimit = overLimit;

    const response = await api.get("/break/admin/all", { params });
    return response.data;
  },

  /**
   * Admin: allowed break options for a selected employee
   * GET /break/admin/options/:userId
   */
  fetchAdminBreakOptions: async (userId) => {
    const response = await api.get(`/break/admin/options/${userId}`);
    return response.data;
  },

  /**
   * Admin: create a break for a user
   * POST /break/admin/create
   * body: { userId, breakConfigId, date, startTime, endTime }
   */
  createBreak: async (payload) => {
    const response = await api.post("/break/admin/create", payload);
    return response.data;
  },

  /**
   * Admin: update break times (HH:mm)
   * PUT /break/admin/update/:breakId
   */
  updateBreak: async (breakId, payload) => {
    const response = await api.put(`/break/admin/update/${breakId}`, payload);
    return response.data;
  },

  /**
   * Admin: get break by id
   * GET /break/admin/:breakId
   */
  getBreakById: async (breakId) => {
    const response = await api.get(`/break/admin/${breakId}`);
    return response.data;
  },

  /**
   * Admin: delete a break
   * DELETE /break/admin/delete/:breakId
   */
  deleteBreak: async (breakId) => {
    const response = await api.delete(`/break/admin/delete/${breakId}`);
    return response.data;
  },
};
