import { PrismaClient } from "@prisma/client";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { nodeCron as cron } from "node-cron";

import CommandHandler from "./Handlers/CommandHandler.js";
import ErrorHandler from "./Handlers/ErrorHandler.js";
import EventHandler from "./Handlers/EventHandler.js";
import InteractionHandler from "./Handlers/InteractionHandler.js";

import { logErrorMsg, logInfo } from "../functions/logger.js";
import Strings from "../strings.json" with { type: "json" };
import { dbFix } from "functions/utils.js";

export default class Bot extends Client {
    commands: Collection<string, any>;
    interactions: Collection<string, any>;
    db: PrismaClient;
    inserted_token: string;
    
    constructor(token: string) {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildIntegrations,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
            ],
        });
    
        this.commands = new Collection();
        this.interactions = new Collection();
        this.db = new PrismaClient();
        this.inserted_token = token;
    }
  
    async start() {
        logInfo(Strings.logs_startup);
        
        await new EventHandler(this).loadEvents();
        this.commands = await new CommandHandler(this).loadCommands();
        this.interactions = await new InteractionHandler(this).loadInteractions();
        await new ErrorHandler(this).preventErrors();
        
        try {
            await this.login(this.inserted_token)
        }
        catch (e) {
            logErrorMsg(e, Strings.logs_error_startup)
        }
		
		cron.schedule("*/15 * * * *", async () => {
			dbFix(this);
		});
    }
}