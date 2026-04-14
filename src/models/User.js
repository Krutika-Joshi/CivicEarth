const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["citizen", "admin", "authority"],
            default: "citizen"
        },

        city: {
            type: String,
            required: true
        },

        displayName: {
            type: String,
            required: true,
            unique: true
        },
        authorityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Authority",
            default: null
        }

    },

    {
        timestamps: true
    }
    
);

const User = mongoose.model("User", userSchema);

module.exports = User;