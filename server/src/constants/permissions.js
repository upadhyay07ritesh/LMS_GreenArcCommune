// server/src/constants/permissions.js
export const ALLOWED_PERMISSIONS = [
  "dashboard",
  "courses",
  "students",
  "analytics",
  "liveSessions",
  "manageAdmins",
  // add future permissions here
];

export const SUPERADMIN_PERMISSIONS = Object.fromEntries(
  ALLOWED_PERMISSIONS.map((p) => [p, true])
);
