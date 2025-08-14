import {
    ChatInputCommandInteraction,
    PermissionsBitField,
    SlashCommandBuilder
} from "discord.js";

import Bot from "../classes/Bot.js";
import Strings from "../strings.json" with { type: "json" };

export const data = { ...new SlashCommandBuilder()
    .setName("utwórz")
    .setDescription(Strings.create_description)
    .setDefaultMemberPermissions(PermissionsBitField.Flags.UseApplicationCommands)
    .setDMPermission(false)
    .addStringOption((option) => option
        .setName("nick")
        .setDescription(Strings.create_field_description_nick)
        .setRequired(true)
    )
    .addStringOption((option) => option
        .setName("uuid")
        .setDescription(Strings.create_field_description_uuid)
        .setRequired(false)
    )
    .toJSON(),
};

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({
        ephemeral: false,
    });

    //TODO: Do stuff in the database here

    // Send success message
    await interaction.editReply({
        content: `(odpowiedź testowa)`,
    });
}