import api from "../../../config/axios";

export const useDepartmentApi = {
  fetchDepartment: async () => {
    try {
      const response = await api.get("/department");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createDepartment: async (departmentData) => {
    try {
      const response = await api.post("/department", departmentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateDepartment: async (departmentId, departmentData) => {
    try {
      const response = await api.put(
        `/department/${departmentId}`,
        departmentData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteDepartment: async (departmentId) => {
    try {
      const response = await api.delete(`/department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
