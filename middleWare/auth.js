const jwt = require("jsonwebtoken");

//

module.exports = async function (req, res, next) {
  // getting token
  const token = req.header("auth-token");
  
  if (!token) {
    return res.status(500).json({ msg: "No token, Invalid credentials" });
  }
  try {
    // Decode the jsonwebtoken
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Assign to request
    
    req.user = decoded;
  } catch (error) {
    res.status(500).json({ msg: "Token is not valid" });
  }
  // NEXT
  next();
};
