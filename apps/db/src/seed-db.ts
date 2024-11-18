import { log } from "@repo/logger";
import { SqlClient } from "./clients/sql-client";

(async () => {
  const sqlClient = SqlClient.getInstance();

  await sqlClient.init("SOL_USDC");

  await sqlClient.disconnect();
})()
  .then(() => {
    log("Database seeded");
  })
  .catch((err) => {
    log(err);
  });
