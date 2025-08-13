import fs from "fs";
import { join } from "path";
import Bot from "../classes/Bot.js";
import { logError, logInfo } from "../functions/logger.js";
import { exit } from "../functions/utils.js";
import Strings from "../strings.json" assert { type: "json" };

export async function run(client: Bot) {
  if (process.argv.includes("--deploy-commands")) {
    if (process.argv.includes("--remove-commands")) {
      logError(Strings.logs_commands_conflict);
      exit(1, client);
    }
    logInfo(Strings.logs_commands_adding);
    if (!fs.existsSync(join(Strings.WORKDIR, "data/.bot_already_ran_once"))){
      fs.mkdirSync(join(Strings.WORKDIR, "data/.bot_already_ran_once"));
    }
    
    const appCommands = Array.from(client.commands.values());
    // await client.application!.commands.set(appCommands.map((x) => x.data));
    await client.application!.commands.set(
      appCommands.map((x) => x.data),
      process.env.DEV_GUILD!
    );
    
    logInfo(Strings.logs_commands_added);
  }

  else if (process.argv.includes("--remove-commands")) {
    logInfo(Strings.logs_commands_removing);
    await client.application!.commands.set([]);
    await client.application!.commands.set([], process.env.DEV_GUILD!);
    logInfo(Strings.logs_commands_removed);
    exit(0, client);
  }

  else{
    if (!fs.existsSync(join(Strings.WORKDIR, "data/.bot_already_ran_once"))){
      logInfo(Strings.logs_commands_hint);
      fs.mkdirSync(join(Strings.WORKDIR, "data/.bot_already_ran_once"));
      exit(0, client);
    }
  }

  logInfo(client.user!.username + Strings.logs_startup_done);
}
