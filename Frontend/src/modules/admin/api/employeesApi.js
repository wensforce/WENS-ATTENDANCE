import api from "../../../config/axios";

export const employeesApi = {
  /**
   * Fetch all employees with pagination
   * @param {number} page - Page number (1-indexed, defaults to 1)
   * @returns {Promise} { employees: [], pagination: { currentPage, totalPages, totalCount, ... } }
   */
  fetchAllEmployees: async ({page = 1, search = ""}) => {
    
    const response = await api.get("/admin/employees", {
      params: { page, search },
    });
    return response.data;
  },

  /**
   * Create a new employee
   * @param {Object} payload - Employee form data
   */
  createEmployee: async (payload) => {
    const response = await api.post("/admin/employee", payload);
    return response.data;
  },

  /**
   * Update an existing employee
   * @param {string|number} id - Employee ID
   * @param {Object} payload - Updated employee form data
   */
  updateEmployee: async (id, payload) => {
    const response = await api.put(`/admin/employee/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a single employee
   * @param {string|number} id - Employee ID
   */
  deleteEmployee: async (id) => {
    const response = await api.delete(`/admin/employee/${id}`);
    return response.data;
  },

    /**
   * Get a single employee
   * @param {string|number} id - Employee ID
   */

  getEmployee: async (id) => {
    const response = await api.get(`/admin/employee/${id}`);
    return response.data;
  },

  /**
   * Bulk delete multiple employees
   * @param {Array<string|number>} ids - Array of employee IDs
   */
  bulkDeleteEmployees: async (ids) => {
    const response = await api.delete("/admin/employees/bulk", {
      data: { ids },
    });
    return response.data;
  },

  resetEmployeePin: async (email) => {
    const response = await api.post(`/admin/employee/reset-pin`, { email });
    return response.data;
  }
};
