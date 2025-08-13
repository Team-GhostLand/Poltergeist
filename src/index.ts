import "dotenv/config";

import Bot from "./classes/Bot.js";
import { failStartup, logfileSessionOpen } from "./functions/logger.js";


function getDir(): string{
    return import.meta.dir;
}

export const mainCodeDir: string = getDir();

try {
    logfileSessionOpen();
}
catch (e) {
    failStartup(e);
}

const client = new Bot();

client.start().then(() => null);
export default client;