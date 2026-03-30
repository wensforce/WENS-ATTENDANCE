import api from "../../../config/axios.js";

export const authApi = {
  login: async (email, mobileNumber, password) => {
    console.log(
      "email",
      email,
      "mobileNumber",
      mobileNumber,
      "password",
      password,
    );

    try {
      let response;
      if (email) {
        response = await api.post("/auth/login", { email, pin: password });
      } else if (mobileNumber) {
        response = await api.post("/auth/login", {
          mobileNumber,
          pin: password,
        });
      } else {
        throw new Error("Invalid email or mobile number");
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to login");
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await api.post("/auth/logout");
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to logout");
    }
  },
};
