import { join } from "path";

import { loadHandlers } from "functions/utils.js";
import { mainCodeDir } from "index.js";
import Bot from "../Bot.js";

export default class EventHandler {
    client: Bot;
    constructor(client: Bot) {
        this.client = client;
    }
  
    async loadEvents(): Promise<void> {
        const workdir = join(mainCodeDir, "events");
        const result = await loadHandlers(false, {dir: workdir, displayname: "EVENT"});
        result.forEach((val, key) => {
            this.client.on(key, (...args) => val.run(this.client, ...args));
        });
    }
}