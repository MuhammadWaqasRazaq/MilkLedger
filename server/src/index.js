import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { ensureDefaultRates } from "./services/rateService.js";

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/milk_ledger";

async function start() {
  await connectDatabase(MONGODB_URI);
  console.log("[db] connected to MongoDB");
  await ensureDefaultRates();

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[server] Milk Ledger API listening on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error("[startup error]", error);
  process.exit(1);
});
