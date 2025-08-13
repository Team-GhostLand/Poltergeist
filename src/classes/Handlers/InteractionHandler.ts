import { Collection, Interaction } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

import { logInfo } from "../../functions/logger.js";
import Strings from "../../strings.json" assert { type: "json" };
import Bot from "../Bot.js";

export default class InteractionHandler extends Collection<
  string,
  Interaction
> {
  client: Bot;
  constructor(client: Bot) {
    super();
    this.client = client;
  }

  async loadInteractions(): Promise<Collection<string, any>> {
    const workdir = join(Strings.WORKDIR, "dist/interactions");
    logInfo(Strings.logs_registry_interactions_begin + workdir);
    const categoryFolders = readdirSync(workdir);
    
    for (const categoryFolder of categoryFolders) {
      const interactionFolder = readdirSync(
        join(workdir, categoryFolder)
      );
      for (const interactionFile of interactionFolder) {
        if (!interactionFile.endsWith(".js")) continue;

        const interaction = await import(
          join(workdir, categoryFolder, interactionFile)
        );

        this.set(interactionFile.slice(0, -3), interaction);

        logInfo(Strings.logs_registry_interactions_found + interactionFile+"@"+categoryFolder);
      }
    }
    return this;
  }
}
