import api from "../../../config/axios";

export const useDashboardApi = {
  fetchDashboardData: async () => {
    try {
      const response = await api.get("/dashboard/user");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const useAttendanceApi = {
  checkIn: async (data) => {
    try {
      const response = await api.post("/attendance/check-in", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  checkOut: async (data) => {
    try {
      const response = await api.post("/attendance/check-out", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  specialCheckIn: async (data) => {
    try {
      const response = await api.post("/attendance/special-check-in", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  specialCheckOut: async (data) => {
    try {
      const response = await api.post("/attendance/special-check-out", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
