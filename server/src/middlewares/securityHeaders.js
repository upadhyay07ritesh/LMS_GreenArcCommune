// server/middleware/securityHeaders.js
module.exports = function securityHeaders(req, res, next) {
  // Note: tighten CSP to your needs. This is a conservative example.
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Example CSP (customize for your asset hosts)
  // disallow inline-scripts/styles unless you specifically require them
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self' https://your-api.example.com",
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);

  next();
};
