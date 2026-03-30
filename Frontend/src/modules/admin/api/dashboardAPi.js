import api from "../../../config/axios";

export const useDashboardApi = {
  fetchDashboardData: async () => {
    try {
      const response = await api.get("/dashboard/admin");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
