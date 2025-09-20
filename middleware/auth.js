const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Core API keys
  const mainKey = process.env.API_KEY; // Main production key (0e8f5f7ec6a5589b4f2d89aba194d23bcd302578b81f73fba35970a8fe392ba1)
  const publicKey = process.env.PUBLIC_API_KEY; // GPT read-only key
  const adminKey = process.env.ADMIN_API_KEY; // GPT admin key

  if (!mainKey && !publicKey && !adminKey) {
    console.error("No API keys configured in environment");
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

  // Check if token matches any valid key
  const isMainKey = mainKey && token === mainKey;
  const isPublicKey = publicKey && token === publicKey;
  const isAdminKey = adminKey && token === adminKey;

  if (!isMainKey && !isPublicKey && !isAdminKey) {
    console.log(`Authentication failed for IP: ${req.ip}, Key: ${token.substring(0, 8)}...`);
    return res.status(403).json({ 
      error: "Invalid API key" 
    });
  }

  // Store auth level in request for later use
  req.authLevel = isAdminKey ? 'admin' : (isMainKey ? 'main' : 'public');
  
  // Log successful authentication
  console.log(`API access granted (${req.authLevel}) for IP: ${req.ip} at ${new Date().toISOString()}`);
  next();
};

// New middleware specifically for admin operations
const authenticateAdminAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    console.error("ADMIN_API_KEY not configured in environment");
    return res.status(500).json({ 
      error: "Admin endpoint not configured" 
    });
  }

  if (!authHeader) {
    return res.status(401).json({ 
      error: "Missing Authorization header. Include: Authorization: Bearer <admin-api-key>" 
    });
  }

  // Support both "Bearer <key>" and direct key formats
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader;

  if (token !== adminKey) {
    console.log(`Admin authentication failed for IP: ${req.ip}, Key: ${token.substring(0, 8)}...`);
    return res.status(403).json({ 
      error: "Invalid admin API key" 
    });
  }

  // Log successful admin authentication
  console.log(`Admin API access granted for IP: ${req.ip} at ${new Date().toISOString()}`);
  next();
};

// Cypher query sanitizer for read-only operations
const sanitizeReadOnlyQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Query must be a non-empty string' };
  }

  // Normalize query - remove extra whitespace and convert to uppercase for checking
  const normalizedQuery = query.trim().toUpperCase();
  
  // Allow read-only operations
  const allowedOperations = [
    'MATCH',
    'RETURN',
    'WITH',
    'UNWIND',
    'CALL',      // For read-only procedures
    'OPTIONAL',  // OPTIONAL MATCH
    'WHERE',
    'ORDER',     // ORDER BY
    'SKIP',
    'LIMIT',
    'DISTINCT',
    'AS',
    'COUNT',
    'COLLECT',
    'EXISTS'
  ];

  // Block write operations (case-insensitive)
  const blockedOperations = [
    'CREATE',
    'MERGE',
    'DELETE',
    'REMOVE',
    'SET',
    'DROP',
    'DETACH DELETE',
    'LOAD CSV',
    'FOREACH'
  ];

  // Check for blocked operations
  for (const operation of blockedOperations) {
    if (normalizedQuery.includes(operation)) {
      return { 
        isValid: false, 
        error: `Write operation '${operation}' not allowed in read-only endpoint. Use /api/admin-query for write operations.` 
      };
    }
  }

  // Additional security checks
  if (normalizedQuery.includes('CALL DB.') || normalizedQuery.includes('CALL DBMS.')) {
    return { 
      isValid: false, 
      error: 'System procedure calls not allowed in public endpoint' 
    };
  }

  return { isValid: true };
};

module.exports = { authenticateAPI, authenticateAdminAPI, sanitizeReadOnlyQuery };
