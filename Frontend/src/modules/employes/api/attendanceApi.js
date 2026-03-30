import api from "../../../config/axios";

const calenderApi = {
  getSummary: async (employeeId, month, year) => {
    try {
      // Simulate an API call with a delay
      const res = await api.get(
        `/attendance/calender?userId=${employeeId}&month=${month}&year=${year}`,
      );
      return res.data;
    } catch (error) {
      throw error;
    }
  },
  getAttendanceDetails: async (attendanceId) => {
    try {
      const res = await api.get(`/attendance/get-details/${attendanceId}`);
      console.log(res);
      
      return res.data;
    } catch (error) {
      throw error;
    }
  },
  getSpecialDayAttendance: async (specialDayId) => {
    try {
      const res = await api.get(`/attendance/get-special-details/${specialDayId}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  },
  getHolidayAttendance: async (holidayId) => {
    try {
      const res = await api.get(`/leaves/get/${holidayId}`);
      return res.data;
    } catch (error) {
      throw error;
    }
    },
};

export default calenderApi;
