// ---------------------------------------------------------------------------
// middleware/auth.js — ASGI-style auth gate + application resolution
//
// Extracts {application} from /api/cp/{application}/... and stores it on
// req.application.  In internal/dev mode a stub user is injected.
// ---------------------------------------------------------------------------

function authGate(req, res, next) {
  // Extract application from URL  /api/cp/:application/...
  const match = req.path.match(/^\/api\/cp\/([^/]+)/);
  if (match) {
    req.application = match[1];
  }

  // PoC: always inject a dev user (no real auth)
  req.user = {
    oid: "dev-user-000",
    name: "Dev User",
    roles: ["admin"],
  };

  next();
}

module.exports = authGate;
