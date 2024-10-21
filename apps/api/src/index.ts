import { log } from "@repo/logger";
import { createServer } from "./server";
import { env } from "./environment";

const port = env.PORT;
const server = createServer();

server.listen(port, () => {
  log(`api running on ${port} in ${env.NODE_ENV} mode`);
});
