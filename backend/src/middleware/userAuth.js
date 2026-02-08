import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies.token;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authorized. Please login." 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }

    // Add user ID to request
    req.userId = decoded;
    
    // Add timestamp check (optional - prevent old tokens)
    const tokenAge = Date.now() - (decoded.iat * 1000);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (tokenAge > maxAge) {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired. Please login again." 
      });
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Session expired. Please login again." 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token. Please login again." 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Authentication error" 
    });
  }
};

export default userAuth;