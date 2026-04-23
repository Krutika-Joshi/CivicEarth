const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateDisplayName = require("../utils/generateDisplayName");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    let { name, email, password, city } = req.body;

    // 🔥 DEBUG
    console.log("Incoming:", req.body);

    // ✅ VALIDATION FIRST
    if (!name || !email || !password || !city) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // ✅ SAFE LOWERCASE
    email = email.toLowerCase();

    // ✅ CHECK EXISTING USER
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // ✅ HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ GENERATE DISPLAY NAME
    const displayName = generateDisplayName(city);

    // ✅ CREATE USER
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      city,
      displayName,
      role: "user"
    });

    // ✅ RESPONSE
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city,
        displayName: user.displayName,
        role: user.role
      }
    });

  } catch (error) {
    // 🔥 IMPORTANT DEBUG
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      message: error.message // 🔥 now you’ll see real error
    });
  }
};


// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and Password are required"
      });
    }

    email = email.toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        authorityId: user.authorityId || null
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city,
        displayName: user.displayName,
        role: user.role,
        authorityId: user.authorityId || null
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = { registerUser, loginUser };