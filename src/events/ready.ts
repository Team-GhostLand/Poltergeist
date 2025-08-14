import Bot from "../classes/Bot.js";
import { logInfo } from "../functions/logger.js";
import Strings from "../strings.json" with { type: "json" };

export async function run(client: Bot) {
    logInfo(client.user!.username + Strings.logs_startup_done);
}