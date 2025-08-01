import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import {
  addPendingSignup,
  getPendingSignup,
  removePendingSignup,
} from "../utils/pendingSignups.js";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function handleError(res, error, context = "") {
  if (context) {
    console.error(`[${context}]`, error.message);
  } else {
    console.error(error.message);
  }
  return res
    .status(500)
    .json({ message: "Server error", error: error.message });
}

export const signup = async (req, res) => {
  try {
    console.log("Signup request body:", req.body);
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) {
      return res
        .status(400)
        .json({
          message: "All fields (userName, email, password) are required.",
        });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    addPendingSignup({
      userName,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
    });
    await sendEmail(email, "Your OTP for BatterTrack", `Your OTP is: ${otp}`);
    res
      .status(201)
      .json({
        message:
          "OTP sent to your email. Please verify to complete registration.",
      });
  } catch (err) {
    return handleError(res, err, "Signup");
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const pending = getPendingSignup(email);
    if (!pending) {
      return res
        .status(400)
        .json({ message: "No pending signup found or OTP expired." });
    }

    if (
      pending.otp !== otp ||
      !pending.otpExpiry ||
      pending.otpExpiry < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = new User({
      userName: pending.userName,
      email: pending.email,
      password: pending.password,
      isVerified: true,
    });

    await user.save();
    removePendingSignup(email);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res.status(200).json({
      message: "Email verified and registration complete.",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
      },
    });
  } catch (err) {
    return handleError(res, err, "Verify OTP");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      accessToken,
      refreshToken,
      user: { id: user._id, userName: user.userName, email: user.email },
    });
  } catch (err) {
    return handleError(res, err, "Login");
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== "refresh") {
      return res.status(401).json({ message: "Invalid token type" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      accessToken: newAccessToken,
      user: { id: user._id, userName: user.userName, email: user.email },
    });
  } catch (err) {
    return handleError(res, err, "Refresh Token");
  }
};

export const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    return handleError(res, err, "Logout");
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      data: {
        name: user.userName,
        email: user.email,
        phone: user.phone || "",
        vehicleNumber: user.vehicleNumber || "",
        emergencyContact: user.emergencyContact || "",
      },
    });
  } catch (err) {
    return handleError(res, err, "Get Profile");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, email, phone, vehicleNumber, emergencyContact } = req.body;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.userName = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (vehicleNumber !== undefined) user.vehicleNumber = vehicleNumber;
    if (emergencyContact !== undefined)
      user.emergencyContact = emergencyContact;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      data: {
        name: user.userName,
        email: user.email,
        phone: user.phone || "",
        vehicleNumber: user.vehicleNumber || "",
        emergencyContact: user.emergencyContact || "",
      },
    });
  } catch (error) {
    return handleError(res, error, "Update Profile");
  }
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    // Find user and verify password
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Delete Account");
  }
};


export const selectMode = async (req, res) => {
  const { mode } = req.body;
  const userId = req.user._id;

  if (!['sweet', 'street'].includes(mode)) {
    return res.status(400).json({ message: 'Invalid mode selected' });
  }

  await User.findByIdAndUpdate(userId, { mode });
  res.status(200).json({ message: `Mode set to ${mode}` });
};