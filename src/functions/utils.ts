import {
    ButtonInteraction,
    Channel,
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
import Bot from "../classes/Bot.js";
import { logError } from "./logger.js";

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
        bot.destroy();
    }
    process.exit(code);
}

export function classNameToClassId(name: string): number {
    return 0; //TODO: Implement
}

export const roleList: string[] = [
    "Gospodarz", //0
    "Zastępca gospodarza", //1
    "Skarbnik", //2
    "Brak/Ukryta", //3
    `"we have Trójki Klasowe at home" - Łącznik z Biblioteką` //4 - NIE MA NA SERWERZE ANI W KOMENDZIE `/klasa`! //TODO: Add support everywhere.
    //555 - 777 -> Nauczyciele: 5(yes), 7(no); NAUCZYCIEL/STAFF/MANAGEMENT //TODO: Implement
]