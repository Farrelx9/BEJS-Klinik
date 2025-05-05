const { createTransporter } = require("../libs/nodemailer");

module.exports = async (mailOptions) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};
