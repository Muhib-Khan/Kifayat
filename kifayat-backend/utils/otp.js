const crypto = require("crypto");
const Otp = require("../models/Otp");

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const generateOTP = () =>
  crypto.randomInt(100000, 999999).toString();

const hashOTP = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

const getOTPExpiry = () => new Date(Date.now() + OTP_EXPIRY_MS);

const isOTPExpired = (otpExpiry) => {
  if (!otpExpiry) return true;
  return new Date() > new Date(otpExpiry);
};

// Persistent (MongoDB-backed) OTP store — survives restarts and works across workers.
const storeOTP = (key, purpose, hashedOtp, expiry) =>
  Otp.findOneAndUpdate(
    { key },
    { key, purpose, hashedOtp, expiry },
    { upsert: true, returnDocument: "after" },
  ).exec();

const consumeOTP = (key) => Otp.findOneAndDelete({ key }).exec();

const findOTP = (key) => Otp.findOne({ key }).exec();

module.exports = { generateOTP, hashOTP, getOTPExpiry, isOTPExpired, storeOTP, findOTP, consumeOTP };
