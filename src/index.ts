import "dotenv/config";

import { REST, Routes } from "discord.js";
import { exit, loadHandlers } from "functions/utils.js";
import Bot from "./classes/Bot.js";
import { failStartup, logError, logErrorMsg, logfileSessionOpen, logInfo } from "./functions/logger.js";
import Strings from "./strings.json" with { type: "json" };


// --- STEP 1: EXPORT THE WORKDIR --
function getDir(): string{
    return import.meta.dir;
}

export const mainCodeDir: string = getDir();


// --- STEP 2: SETUP THE LOGGER --
try {
    logfileSessionOpen();
}
catch (e) {
    failStartup(e);
}


// --- STEP 3: SANITY CHECK --
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === "Bot token. Must be set."){
    logError(Strings.logs_no_token);
    exit(1);
}
if (!process.env.LOGGER_WEBHOOK || process.env.LOGGER_WEBHOOK === "Webhook token for the error-logging webhook. Optional if you don't want to use this feature."){
    logError(Strings.logs_no_wh_token);
}


// --- STEP 4: REGISTER THE COMMANDS IF DOING SO WAS REQUESTED ---
if (process.argv.includes("--deploy-commands")) {
    if (process.argv.includes("--remove-commands")) {
        logError(Strings.logs_commands_conflict);
        exit(1);
    }
    
    if (!process.env.CLIENT_ID || process.env.CLIENT_ID === "Bot client ID. Must be set to deploy/remove commands, otherwise useless."){
        logError(Strings.logs_commands_add_failed, "no client ID");
        exit(1);
    }

    logInfo(Strings.logs_commands_adding);
    const commands: string[] = [];
    const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);
    
    
    try {
        const appCommands = await loadHandlers(true);
        appCommands.forEach((command) => commands.push(command.data.toJSON()));
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID as string), { body: commands })
    }
    catch (e){
        logErrorMsg(e, Strings.logs_commands_add_failed);
        exit(1);
    }
    
    
    logInfo(Strings.logs_commands_added);
    exit(0);
}
else if (process.argv.includes("--remove-commands")) {
    if (!process.env.CLIENT_ID || process.env.CLIENT_ID === "Bot client ID. Must be set to deploy/remove commands, otherwise useless."){
        logError(Strings.logs_commands_remove_failed, "no client ID");
        exit(1);
    }
    
    logInfo(Strings.logs_commands_removing);
    const rest = new REST().setToken("REST");
    
    (async () => {
        try {
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID as string), { body: [] })
        }
        catch (e){
            logErrorMsg(e, Strings.logs_commands_remove_failed);
            exit(1);
        }
    })
    
    logInfo(Strings.logs_commands_removed);
    exit(0);
}


// --- STEP 5: START THE BOT ---
const client = new Bot(process.env.DISCORD_TOKEN as string);

client.start().then(() => null);
export default client;


// --- STEP 6: HANDLE EXITS ---
process.on('SIGINT', function() {
    logInfo(Strings.logs_stop_ctrlc)
    exit(0, client)
});