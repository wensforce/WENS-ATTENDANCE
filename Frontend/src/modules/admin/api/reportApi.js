import api from "../../../config/axios.js";

export const usereportApi = {
  getAllUserReport: async (month, year, page, limit, search, userType = "") => {
    const response = await api.get(
      `/report/monthly-report?month=${month}&year=${year}&page=${page}&limit=${limit}&search=${search}&userType=${userType}`,
    );
    return response.data;
  },

  exportAllUserReport: async (month, year, search, userType = "") => {
    const response = await api.get(
      `/report/export?month=${month}&year=${year}&search=${search}&userType=${userType}`,
    );
    return response.data;
  },

  getUserReportById: async (
    employeeId,
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),
  ) => {

    const response = await api.get(
      `/report/monthly-report/${employeeId}?month=${month}&year=${year}`,
    );
    return response.data;
  },
};
