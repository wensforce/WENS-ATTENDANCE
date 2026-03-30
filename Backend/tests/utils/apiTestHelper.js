import app from "../../src/app.js";
import request from "supertest";

export const apiRequest = request(app);

export const makeAuthRequest = async (method, endpoint, data = null) => {
  let req = apiRequest[method](endpoint);

  if (data) {
    req = req.send(data);
  }

  return req;
};
