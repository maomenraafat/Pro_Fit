import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as dotenv from "dotenv";
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

initializeApp({
  credential: cert(serviceAccount),
});

const messaging = getMessaging();
export { messaging };
