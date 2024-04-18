export function generateRandomOTP() {
  const min = 1000; // Minimum value for a four-digit OTP
  const max = 9999; // Maximum value for a four-digit OTP
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}
