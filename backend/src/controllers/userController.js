import UserModel from "../models/User.js";

export const getUserData = async (req, res) => {
    try {
        const userId = req.user;
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({ 
            success: true, 
            user: { // ✅ Changed from 'userData' to 'user'
                name: user.username, // ✅ Changed from user.name to user.username (based on your model)
                email: user.email, // ✅ Added email
                isAccountVerified: user.isAccountVerified,
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}