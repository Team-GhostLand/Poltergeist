import fs from "fs";
import { join } from "path";

import { mainCodeDir } from "index.js";
import { logInfo } from "../../functions/logger.js";
import Strings from "../../strings.json" assert { type: "json" };
import Bot from "../Bot.js";

export default class EventHandler {
    client: Bot;
    constructor(client: Bot) {
        this.client = client;
    }
  
    async loadEvents(): Promise<void> {
        const workdir = join(mainCodeDir, "events");
        logInfo(Strings.logs_registry_events_begin + workdir);
        const eventFolder = fs.readdirSync(workdir);
        
        for (const eventFile of eventFolder) {
            if (!eventFile.endsWith(".js")) continue;
            
            const event = await import(
                join(workdir, eventFile)
            );
            
            this.client.on(eventFile.slice(0, -3), (...args) => {
                event.run(this.client, ...args);
            });
          
            logInfo(Strings.logs_registry_events_found + eventFile);
        }
    }
}