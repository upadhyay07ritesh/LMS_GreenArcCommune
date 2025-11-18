import fs from "fs";
import path from "path";

export function generateICS(session) {
  const start = new Date(session.date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const ics = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${session.title}
DTSTART:${start}
DESCRIPTION:Live trading session from GreenArc Commune
END:VEVENT
END:VCALENDAR
`;

  const filePath = path.join("/tmp", `session-${session._id}.ics`);
  fs.writeFileSync(filePath, ics);

  return filePath;
}
