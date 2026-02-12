import { reportService } from "./src/services/report.service";
import { contextStorage } from "./src/config/context";

async function main() {
  console.log("Running month summary for salão (fallback test)...");
  await contextStorage.run({ system: "salao" }, async () => {
    const summary = await reportService.getMonthSummary(2026, 2);
    console.log(JSON.stringify(summary, null, 2));
  });
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));