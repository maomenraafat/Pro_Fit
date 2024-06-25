import { messaging } from "../../firebaseAdmin.js";

export const sendNotification = async (token, title, body) => {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: token,
    };
  
    try {
      const response = await messaging.send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };