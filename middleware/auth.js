const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    console.error("API_KEY not configured in environment");
    return res.status(500).json({ 
      error: "Server configuration error" 
    });
  }

  if (!authHeader) {
    return res.status(401).json({ 
      error: "Missing Authorization header. Include: Authorization: Bearer <api-key>" 
    });
  }

  // Support both "Bearer <key>" and direct key formats
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader;

  if (token !== expectedKey) {
    console.log(`Authentication failed for IP: ${req.ip}, Key: ${token.substring(0, 8)}...`);
    return res.status(403).json({ 
      error: "Invalid API key" 
    });
  }

  // Log successful authentication
  console.log(`API access granted for IP: ${req.ip} at ${new Date().toISOString()}`);
  next();
};

module.exports = { authenticateAPI };
