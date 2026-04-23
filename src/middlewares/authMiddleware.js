const User = require("../models/User");
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        const authHeader = req.headers.authorization;
        token = authHeader.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            message: "Not authorized, token missing"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select(
            "_id role displayName authorityId"
        );

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        req.user = {
            id: user._id,
            role: user.role,
            displayName: user.displayName,
            authorityId: user.authorityId
        };

        // 🔥 optional debug
        // console.log("User:", req.user);

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Not authorized, token invalid"
        });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };