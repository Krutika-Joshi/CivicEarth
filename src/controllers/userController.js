const User = require("../models/User");
const generateDisplayName = require("../utils/generateDisplayName");

const updateUser = async (req, res) => {
  try {
    const { name, email, city } = req.body;

    // 🔥 generate new displayName based on city
    const displayName = generateDisplayName(city);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, city, displayName },
      { new: true }
    );

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      city: updatedUser.city,
      displayName: updatedUser.displayName,
      role: updatedUser.role
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating user",
      error: error.message
    });
  }
};
module.exports = { updateUser };