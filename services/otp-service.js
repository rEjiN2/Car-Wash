const nodemailer = require("nodemailer");
const twilio = require("twilio");
const axios = require("axios");
const bcrypt = require("bcrypt");
const { User } = require("../models/Users");

const createEmailTransporter = () => {
  // For production, consider using services like SendGrid, Mailgun, or Amazon SES
  // For development, you can use Gmail (with app password)
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD, // Use app password if 2FA is enabled
    },
  });
};

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Password Reset OTP",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Please use the following OTP to proceed:</p>
            <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 8px; font-weight: bold;">
              ${otp}
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

// const sendOTPSMS = async (phoneNumber, otp) => {
//   try {
//     // Initialize Twilio client with your credentials
//     const client = twilio(
//       process.env.TWILIO_ACCOUNT_SID,
//       process.env.TWILIO_AUTH_TOKEN
//     );

//     console.log(phoneNumber , otp , "otp" )
//     let formattedPhoneNumber = phoneNumber;

//     if (!phoneNumber.startsWith('+')) {
//       const countryCode = process.env.DEFAULT_COUNTRY_CODE || '+91';
//       const cleanedNumber = phoneNumber.replace(/^0+/, '');
//       formattedPhoneNumber = `${countryCode}${cleanedNumber}`;
//     }

//     console.log('Sending SMS to formatted number:', formattedPhoneNumber);

//     const message = await client.messages.create({
//       body: `Your password reset OTP is: ${otp}. This code will expire in 10 minutes.`,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: formattedPhoneNumber
//     });

//     console.log('SMS sent with SID: ', message.sid);
//     return true;
//   } catch (error) {
//     console.error('Error sending SMS: ', error);
//     return false;
//   }
// };
const sendOTPSMS = async (phoneNumber, otp) => {
  try {
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith("+")) {
      const countryCode = process.env.DEFAULT_COUNTRY_CODE || "+971";
      const cleanedNumber = phoneNumber.replace(/^0+/, "");
      formattedPhoneNumber = `${countryCode}${cleanedNumber}`;
    }

    const response = await axios.post(
      "https://api.courier.com/send",
      {
        message: {
          to: {
            phone_number: formattedPhoneNumber,
          },
          content: {
            body: `Your OTP is: ${otp}. It expires in 10 minutes.`,
          },
          routing: {
            method: "single",
            channels: ["sms"],
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COURIER_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SMS sent successfully:", response.data);
    return true;
  } catch (error) {
    console.error(
      "Error sending SMS:",
      error.response ? error.response.data : error.message
    );
    return false;
  }
};

const verifyOTPAndResetPassword = async (postData) => {
  try {
    const { userId, otp, newPassword } = postData;

    if (!userId || !otp || !newPassword) {
      return {
        status: false,
        message: "User ID, OTP, and new password are required",
      };
    }

    const user = await User.findById(userId);

    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }

    // Check if OTP is valid and not expired
    if (
      user.resetPasswordOTP !== otp ||
      user.resetPasswordOTPExpires < new Date()
    ) {
      return {
        status: false,
        message: "Invalid or expired OTP",
      };
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear OTP fields
    user.password = hashedPassword;

    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    const userUpdated = await user.save();

    return {
      status: true,
      message: "Password has been reset successfully",
    };
  } catch (error) {
    console.error("Verify OTP error:", error);
    return {
      status: false,
      message: "An error occurred while resetting your password",
    };
  }
};

module.exports = {
  sendOTPEmail,
  sendOTPSMS,
  verifyOTPAndResetPassword,
};
