import api from "../../../config/axios";

export const useHolidayApi = {
  fetchHolidays: async ({ month = new Date().getMonth() + 1, year = new Date().getFullYear() }) => {
    try {
      const response = await api.get("/leaves/get", {
        params: {
          month, 
          year, 
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createHoliday: async (holidayData) => {
    try {
      const response = await api.post("/leaves", holidayData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getHolidayById: async (holidayId) => {
    try {
      const response = await api.get(`/leaves/get/${holidayId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateHoliday: async (holidayId, holidayData) => {
    try {
      const response = await api.put(`/leaves/${holidayId}`, holidayData);
      
      return response.data;
    } catch (error) {
      console.error(error);
      
      throw error;
    }
  },
  deleteHoliday: async (holidayId) => {
    try {
      const response = await api.delete(`/leaves/${holidayId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
