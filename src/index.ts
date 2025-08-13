import "dotenv/config";

import { existsSync } from "fs";
import Bot from "./classes/Bot.js";
import { failStartup, logfileSessionOpen } from "./functions/logger.js";
import Strings from "./strings.json" assert { type: "json" };

try {
    if(!existsSync(Strings.WORKDIR)) failStartup();
    logfileSessionOpen();
}
catch {
    failStartup();
}

const client = new Bot();

client.start().then(() => null);
export default client;