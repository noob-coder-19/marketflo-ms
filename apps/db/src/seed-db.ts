import { log } from "@repo/logger";
import { SqlClient } from "./clients/sql-client";

(async () => {
  const sqlClient = SqlClient.getInstance();

  await sqlClient.init("NVB_INR");

  await sqlClient.disconnect();
})()
  .then(() => {
    log("Database seeded");
  })
  .catch((err) => {
    log(err);
  });
