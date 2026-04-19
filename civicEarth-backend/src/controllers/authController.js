const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateDisplayName = require("../utils/generateDisplayName");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
const registerUser = async (req, res) => {
    try {
        let { name, email, password, city } = req.body;

        email = email.toLowerCase();

        if (!name || !email || !password || !city) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const displayName = generateDisplayName(city);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            city,
            displayName,
            role: "user" // ✅ FIXED
        });

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
        res.status(500).json({
            message: "server error",
            error: error.message
        });
    }
};


// ================= LOGIN =================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required"
            });
        }

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
                authorityId: user.authorityId || null // ✅ added
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = { registerUser, loginUser };