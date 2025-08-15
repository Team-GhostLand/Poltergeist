import {
    ButtonInteraction,
    Channel,
    Collection,
    CommandInteraction,
    EmbedBuilder,
    Guild,
    GuildMember,
    Snowflake,
    StringSelectMenuInteraction,
    TextChannel
} from "discord.js";
import "dotenv/config";

import chalk from "chalk";
import { lstatSync, readdirSync } from "fs";
import { join } from "path";
import Bot from "../classes/Bot.js";
import { logError, logErrorMsg, logInfo } from "./logger.js";

import { mainCodeDir } from "index.js";
import Strings from "../strings.json" with { type: "json" };

export async function findGuild(
    id: Snowflake,
    client: Bot
): Promise<Guild | undefined> {
    let returnObject: Guild | undefined;
    const guild = await client.guilds.fetch(id).catch((error) => logError(error));

    if (guild) returnObject = guild;

    return returnObject;
}

export async function findChannel(
    id: Snowflake,
    guild: Guild,
    type: string = "TEXT"
): Promise<Channel | undefined> {
    let returnObject: Channel | undefined;
    switch (type) {
        case "TEXT": {
            let channel = await guild.channels
                .fetch(id)
                .catch((error) => logError(error));

            if (channel && channel.isTextBased()) returnObject = channel;
            break;
        }
        case "VOICE": {
            let channel = await guild.channels
                .fetch(id)
                .catch((error) => logError(error));

            if (channel && channel.isVoiceBased()) returnObject = channel;
            break;
        }
    }

    return returnObject;
}

export async function findMember(
    id: Snowflake,
    guild: Guild
): Promise<GuildMember | undefined> {
    let returnObject: GuildMember | undefined;
    const member = await guild.members
        .fetch(id)
        .catch((error) => logError(error));

    if (member) returnObject = member;

    return returnObject;
}

export function findRole(
    guild: Guild,
    name: string | number,
    notify: boolean = true
) {
    const roleName = typeof name === "number" ? name.toString() : name;
    const role = guild.roles.cache.find((r) => {
        return (
            r.name.toLowerCase() === roleName.toLowerCase() ||
            r.id === roleName.toLowerCase()
        );
    });

    if (!role && notify) {
        logError(
            `The role with the name or ID "${chalk.bold(
                name
            )}" was not found in the "${chalk.bold(guild.name)}" server.`
        );
    }

    return role;
}

export async function clearChannel(channel: TextChannel): Promise<TextChannel> {
    // Clone channel
    const newChannel = await channel.clone();
    await channel.delete();
    return newChannel;
}

export function formatFirstLetter(text: string): string {
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

export async function handleError(
    interaction:
        | CommandInteraction
        | ButtonInteraction
        | StringSelectMenuInteraction,
    error: Error
): Promise<void> {
    const reply = new EmbedBuilder()
        .setTitle("Błąd")
        .setColor("#ff0000")
        .setDescription(
            `Wystąpił nieoczekiwany błąd podczas wykonywania akcji.\n> ${
                error.message.length < 1500
                    ? `Błąd: \`${error.message}\``
                    : "Spróbuj ponownie później."
            }`
        )
        .setTimestamp();

    switch (interaction.replied) {
        case true: {
            await interaction.followUp({
                embeds: [reply],
            });
            break;
        }
        case false: {
            await interaction.reply({
                embeds: [reply],
            });
            break;
        }
    }

    logError(error as any);
}

export function exit(code: number, bot?: Bot){
    if(bot){
        try{
            bot.db.$disconnect();
        }
        catch (e){
            logErrorMsg(e, Strings.logs_prisma_stop_failed)
        }
        bot.destroy();
    }
    process.exit(code);
}

export async function loadHandlers(isCommand: boolean, from?: { dir: string, displayname: string }): Promise<Collection<string, any>> {
    
    if (!from){ 
        if (isCommand) return loadHandlers(true, {dir: join(mainCodeDir, "commands"), displayname: "CMD"});
        else {
            logError(Strings.logs_registry_error);
            return new Collection<string, any>;
        }
    }
    
    logInfo(Strings.logs_registry_begin + from.displayname);
    const commandFolder = readdirSync(from.dir);
    let output = new Collection<string, any>();
    
    for (const subfolderOrCommandFile of commandFolder) {
        
        let fullPathOfSubfolderOrCommandFile = join(from.dir, subfolderOrCommandFile)
        
        if(lstatSync(fullPathOfSubfolderOrCommandFile).isDirectory()){
            output = output.concat(await loadHandlers(isCommand, {dir: fullPathOfSubfolderOrCommandFile, displayname: from.displayname+":"+subfolderOrCommandFile}));
            continue;
        }
        
        if (!fullPathOfSubfolderOrCommandFile.endsWith(".ts")) continue;
        
        const command = await import(fullPathOfSubfolderOrCommandFile);
        
        let name = subfolderOrCommandFile.slice(0, -3); //Simple name generation: from the filename
        if (isCommand) name = command.data.name;        //Fancier name generation: from the command itself (commands only)
        
        output.set(name, command);
        logInfo(Strings.logs_registry_found + name+"@"+from.displayname);
    }
    
    return output;
}