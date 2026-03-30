import api from "../../../config/axios";

export const attendanceApi = {
  /**
   * Fetch all attendance records with pagination and filters
   * @param {number} page - Page number (1-indexed, defaults to 1)
   * @param {Object} filters - Filter options { userId, startDate, endDate, status }
   * @returns {Promise} { attendanceRecords: [], pagination: { currentPage, totalPages, totalCount, ... } }
   */
  fetchAllAttendance: async (page = 1, filters = {}) => {
    const params = { page };
    if (filters.userId) params.userId = filters.userId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;

    const response = await api.get("/attendance", { params });
    return response.data;
  },

  /**
   * Create a new attendance record
   * @param {Object} payload - Attendance form data
   */
  createAttendance: async (payload) => {
    const response = await api.post("/attendance", payload);
    return response.data;
  },

  /**
   * Update an existing attendance record
   * @param {string|number} id - Attendance ID
   * @param {Object} payload - Updated attendance form data
   */
  updateAttendance: async (id, payload) => {
    const response = await api.put(`/attendance/update/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a single attendance record
   * @param {string|number} id - Attendance ID
   */
  deleteAttendance: async (id) => {
    const response = await api.delete(`/attendance/delete/`,{
        data: { attendanceIds: [id] },
    });
    return response.data;
  },

    /**
   * Get a single attendance record
   * @param {string|number} id - Attendance ID
   */

  getAttendance: async (id) => {
    const response = await api.get(`/attendance/get-details/${id}`);
    return response.data;
  },

  /**
   * Bulk delete multiple attendance records
   * @param {Array<string|number>} ids - Array of attendance IDs
   */
  bulkDeleteAttendance: async (ids) => {
    const response = await api.delete("/attendance/delete", {
      data: { attendanceIds: ids },
    });
    return response.data;
  },
};
