import {
    ChatInputCommandInteraction,
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder
} from "discord.js";

import Bot from "../../classes/Bot.js";
import { logInfo } from "../../functions/logger.js";
import { exit } from "../../functions/utils.js";
import Strings from "../../strings.json" with { type: "json" };

export const data = {
    ...new SlashCommandBuilder()
        .setName("stop")
        .setDescription(Strings.stop_description)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .toJSON()
};

export async function run(
    client: Bot,
    interaction: ChatInputCommandInteraction
) {
    if (!process.env.PREVENT_REMOTE_SHUTDOWN){
        await interaction.reply({
            content: Strings.stop_stopping,
            ephemeral: false
        })
        logInfo(Strings.logs_stop_cmd + (interaction.member as GuildMember).user.username)
        exit(0, client);
    }
    
    await interaction.reply({
        content: Strings.stop_disabled,
        ephemeral: true
    })
}