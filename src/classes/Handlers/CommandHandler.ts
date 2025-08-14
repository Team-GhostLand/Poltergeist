import { Collection } from "discord.js";

import { loadHandlers } from "functions/utils.js";
import Bot from "../Bot.js";

export default class CommandHandler extends Collection<string, any> {
    client: Bot;
    constructor(client: Bot) {
        super();
        this.client = client;
    }
    
    async loadCommands(): Promise<Collection<string, any>> {
        const result = await loadHandlers(true);
        result.forEach((val, key) => this.set(key, val));
        return this;
    }
}