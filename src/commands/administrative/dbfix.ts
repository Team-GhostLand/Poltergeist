import {
	ChatInputCommandInteraction,
	MessageFlags,
	PermissionsBitField,
	SlashCommandBuilder
} from "discord.js";

import Bot from "../../classes/Bot.js";
import Strings from "../../strings.json" with { type: "json" };
import { dbFix } from "functions/utils.js";

export const data = {
	...new SlashCommandBuilder()
		.setName("dbfix")
		.setDescription(Strings.dbfix_description)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.toJSON()
};

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
	await interaction.reply({ content: Strings.dbfix_scheduled, flags: MessageFlags.Ephemeral });
	await dbFix(client);
}