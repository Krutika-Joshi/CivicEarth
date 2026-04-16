const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateDisplayName = require("../utils/generateDisplayName");
const jwt = require("jsonwebtoken");


const registerUser = async (req, res) => {
    try {
        const { name, email, password, city } = req.body;

        //Checking if the data is missing
        if(!name || !email || !password || !city) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        //If user exists
        const existingUser = await User.findOne({ email });

        if(existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        //Hash password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Generate anonymous display name 
        const displayName = generateDisplayName(city);


        //Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            city,
            displayName
        });

        //Send response
        res.status(201).json({
            messgae: "User registered successfully",
            user: {
                id: user._id,
                displayName: user.displayName,
                city: user.city
            }
        });
    } catch (error) {
        res.status(500).json({
            messgae:"server error",
            error: error.message
        });
    }
    
};

const loginUser = async (req, res) => {
    try {
        //read input
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required"
            });
        }

        //find user by email

        const user = await User.findOne({email});

        if(!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }


        //Compare password
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
                displayName: user.displayName,
                city: user.city,
                role: user.role
            }
        });



    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = { registerUser, loginUser};