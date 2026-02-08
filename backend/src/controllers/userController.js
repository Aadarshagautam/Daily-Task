import UserModel from "../models/User.js";

export const getUserData = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
    
        const user = await UserModel.findById(userId).select('-password');
    
        if (!user) {
          return res.json({ success: false, message: "User not found" });
        }
    
        return res.json({
          success: true,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            isAccountVerified: user.isAccountVerified
          }
        });
      } catch (error) {
        console.error("Get user data error:", error);
        return res.json({ success: false, message: "Failed to get user data" });
      }
}