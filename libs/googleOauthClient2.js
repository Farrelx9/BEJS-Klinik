const { google } = require("googleapis");
const axios = require("axios");

// Inisialisasi OAuth2 Client
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Fungsi untuk mendapatkan access token baru
async function refreshAccessToken() {
  try {
    const { token } = await oAuth2Client.getAccessToken();
    return token;
  } catch {
    console.error("Error retrieving access token", err);
    throw err;
  }
}

// Buat instace Axios
const axiosInstance = axios.create();

// Tambahkan interceptor untuk menangani refresh token
axiosInstance.interceptors.request.use(
  (response) => response,
  async (err) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const token = await refreshAccessToken();
        oAuth2Client.setCredentials({
          access_token: token,
        });

        // Set token baru di header Authorization
        originalRequest.headers["Authorization"] = `Bearer ${token}`;

        // Ulangi request dengan token baru
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        throw refreshError;
      }
    }
  }
);

module.exports = { oAuth2Client, axiosInstance };
