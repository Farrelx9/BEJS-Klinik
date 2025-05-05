const nodemailer = require("nodemailer");
const { oAuth2Client } = require("./googleOauthClient2");

async function createTransporter() {
  try {
    const { token } = await oAuth2Client.getAccessToken();

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.SENDER_GMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: token,
      },
    });
  } catch (error) {
    throw error;
  }
}

module.exports = { createTransporter };
