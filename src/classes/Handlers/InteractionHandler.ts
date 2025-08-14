import { Collection, Interaction } from "discord.js";
import { join } from "path";

import { loadHandlers } from "functions/utils.js";
import { mainCodeDir } from "index.js";
import Bot from "../Bot.js";

export default class InteractionHandler extends Collection<string, Interaction> {
    client: Bot;
    constructor(client: Bot) {
        super();
        this.client = client;
    }
  
    async loadInteractions(): Promise<Collection<string, any>> {
        const workdir = join(mainCodeDir, "interactions");
        const result = await loadHandlers(false, {dir: workdir, displayname: "INTERACTIONS"});
        result.forEach((val, key) => this.set(key, val));
        return this;
    }
}