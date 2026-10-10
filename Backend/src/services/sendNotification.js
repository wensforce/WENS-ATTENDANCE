import admin from "../config/firebase.js";

const sendNotification = (tokens, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    webpush: {
      notification: {
        icon: `${process.env.FRONTEND_URL}/icons/android-chrome-192x192.png`,
      },
      fcmOptions: {
        link: process.env.FRONTEND_URL,
      },
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
