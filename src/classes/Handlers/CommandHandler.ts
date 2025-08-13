import { Collection } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

import { logInfo } from "../../functions/logger.js";
import Strings from "../../strings.json" assert { type: "json" };
import Bot from "../Bot.js";

export default class CommandHandler extends Collection<string, any> {
  client: Bot;
  constructor(client: Bot) {
    super();
    this.client = client;
  }

  async loadCommands(): Promise<Collection<string, any>> {
    const workdir = join(Strings.WORKDIR, "dist/commands");
    logInfo(Strings.logs_registry_commands_begin + workdir);
    const categoryFolders = readdirSync(workdir);
    
    for (const categoryFolder of categoryFolders) {
      const commandFolder = readdirSync(
        join(workdir, categoryFolder)
      );
      for (const commandFile of commandFolder) {
        if (!commandFile.endsWith(".js") || commandFile == "i18next.js")
          continue;

        const command = await import(
          join(workdir, categoryFolder, commandFile)
        );

        this.set(command.data.name, command);
        logInfo(Strings.logs_registry_commands_found + commandFile+"@"+categoryFolder);
      }
    }
    return this;
  }
}
