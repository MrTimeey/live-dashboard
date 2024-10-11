import dotenv from "dotenv";

dotenv.config();

export const appConfig = {
    mail: {
        user: process.env.LIVE_MAIL_USER,
        pass: process.env.LIVE_MAIL_PASS,
        host: process.env.LIVE_MAIL_HOST,
        port: parseInt(process.env.LIVE_PORT) || 993,
    }
};
