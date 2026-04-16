const User = require("../models/User");
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
    let token;

    //check for the token in the header
    if (
        req.headers.authorization && 
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    // If no token, block access
    if(!token) {
        return res.status(401).json({
            message: "Not authorized, token missing"
        });
    }

    try {
        //Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("_id role displayName authorityId");

        if(!user){
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


        //Continue to next middleware/controller
        next();
    } catch(error){
        return res.status(401).json({
            message: "Not authorized, token invalid"
        });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };