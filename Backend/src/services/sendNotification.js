import admin from "../config/firebase.js";

const sendNotification = (tokens, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    tokens,
  };
  admin
    .messaging()
    .sendEachForMulticast(message)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
};

export default sendNotification;
