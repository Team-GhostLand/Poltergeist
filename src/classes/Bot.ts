import { PrismaClient } from "@prisma/client";
import { Client, Collection, GatewayIntentBits } from "discord.js";

import CommandHandler from "./Handlers/CommandHandler.js";
import ErrorHandler from "./Handlers/ErrorHandler.js";
import EventHandler from "./Handlers/EventHandler.js";
import InteractionHandler from "./Handlers/InteractionHandler.js";

import { logError, logInfo } from "../functions/logger.js";
import Strings from "../strings.json" assert { type: "json" };

export default class Bot extends Client {
    commands: Collection<string, any>;
    interactions: Collection<string, any>;
    db: PrismaClient;
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildIntegrations,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
    
        this.commands = new Collection();
        this.interactions = new Collection();
        
        this.db = new PrismaClient();
    }
  
    async start() {
        logInfo(Strings.logs_startup);
        await new EventHandler(this).loadEvents();
        this.commands = await new CommandHandler(this).loadCommands();
        this.interactions = await new InteractionHandler(this).loadInteractions();
        
        await new ErrorHandler(this).preventErrors();
        
        if (!process.env.DISCORD_TOKEN) return logError(Strings.logs_no_token);
        if (process.env.DISCORD_TOKEN === "self-explained") return logError(Strings.logs_no_token);
        await this.login(process.env.DISCORD_TOKEN);
    }
}