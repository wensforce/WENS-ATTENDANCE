import api from "../../../config/axios";

export const specialAttendanceApi = {
    /**
     * Fetch all special attendance records with pagination and filters
     * @param {number} page - Page number (1-indexed, defaults to 1)
     * @param {Object} filters - Filter options { userId, startDate, endDate, status }
     * @returns {Promise} { attendanceRecords: [], pagination: { currentPage, totalPages, totalCount, ... } }
     */
    fetchAllSpecialAttendance: async (page = 1, filters = {}) => {
        const params = { page };
        if (filters.userId) params.userId = filters.userId;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.status) params.status = filters.status;
        if (filters.search) params.search = filters.search;

        const response = await api.get("/attendance/special", { params });
        return response.data;
    },

    /**
     * Update an existing special attendance record
     * @param {string|number} id - Special attendance ID
     * @param {Object} payload - Updated special attendance form data
     * */
    updateSpecialAttendance: async (id, payload) => {
        const response = await api.put(`/attendance/update-special/${id}`, payload);
        return response.data;
    },

    /**
     * Delete a single special attendance record
     * @param {string|number} id - Special attendance ID
     * */
    deleteSpecialAttendance: async (id) => {
        const response = await api.delete(`/attendance/delete-special/`,{
            data: { attendanceIds: [id] },
        });
        return response.data;
    },

    /**
     * Get a single special attendance record
     * @param {string|number} id - Special attendance ID
     * */
    getSpecialAttendance: async (id) => {
        const response = await api.get(`/attendance/get-special-details/${id}`);
        return response.data;
    },
};