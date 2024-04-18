// emailTemplates.js

export const confirmEmailTemplate = (fullName, OTP) => {
  return `
  <h2>Welcome, ${fullName}!</h2>
  <p>Thank you for joining our Fitness Platform. We're excited to have you on board!</p>
  <p>Your OTP for email verification is: <strong>${OTP}</strong></p>
  <p>Please enter this OTP in the provided field to complete your registration.</p>
`;
};

export const resetPasswordTemplate = (fullName, otpCode) => {
  return `
    <h2>Welcome, ${fullName}!</h2>
    <p>We received a request to reset your password. To complete the process, please use the following OTP code:</p>
    <p style="font-size: 24px; font-weight: bold;">${otpCode}</p>
  `;
};

export const acceptanceEmailTemplate = (fullName, signInLink) => {
  return `
    <h2>Congratulations, ${fullName}!</h2>
    <p>We are pleased to inform you that your application has been reviewed and you have been accepted to be a trainer on our Fitness Platform.</p>
    <p>To get started, please click the button below to sign in:</p>
    <a href="${signInLink}">
      <button style="background-color: #007bff; color: #ffffff; padding: 10px 20px; text-align: center; display: block; margin: 0 auto; border: none; border-radius: 5px;">Sign In</button>
    </a>
  `;
};
