/**
 * Standalone launcher for the web viewer.
 * Usage: node dist/viewer/standalone.js [port]
 */
import { startViewer } from "./server.js";

const port = parseInt(process.argv[2] || "3777", 10);

startViewer(port)
  .then((result) => {
    console.log(`Session Vault viewer ${result.status} at ${result.url}`);
    console.log("Press Ctrl+C to stop");
  })
  .catch((err) => {
    console.error("Failed to start viewer:", err.message);
    process.exit(1);
  });
