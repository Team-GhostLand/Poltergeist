import {
	ChatInputCommandInteraction,
	MessageFlags,
	PermissionsBitField,
	SlashCommandBuilder
} from "discord.js";

import { logError, logErrorMsg, logInfo } from "functions/logger.js";
import { getOrCreateUserAndSyncTrust } from "functions/utils.js";
import Bot from "../../classes/Bot.js";
import Strings from "../../strings.json" with { type: "json" };

export const data = {
	...new SlashCommandBuilder()
		.setName("utwórz")
		.setDescription(Strings.migrate_description)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.setDMPermission(false)
		.addStringOption((option) => option
			.setName("nick")
			.setDescription(Strings.migrate_field_description_nick)
			.setRequired(true)
		)
		.addUserOption((option) => option
			.setName("kogo")
			.setDescription(Strings.migrate_field_description_target)
			.setRequired(true)
		)
		.toJSON(),
};

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	try {
		const accounts = client.db.accounts;
		const target  = await getOrCreateUserAndSyncTrust(client, await interaction.guild?.members.fetch(interaction.options.getUser("kogo", true)), "TRUSTY_COMMAND");
		const nick = interaction.options.getString("nick", true);
		const uuid = await loadMojangUUID(nick);
		
		if (!target.resolved) {
			logError(Strings.migrate_log_no_target);
			await interaction.editReply({ content: Strings.migrate_error_no_target });
			return;
		}
		
		const linked = await accounts.findUnique({ where: { mcuuid: uuid } });
		if (uuid === "WRONG!") {
			logError(Strings.migrate_log_invalid);
			await interaction.editReply({ content: Strings.migrate_invalid });
			return;
		} else if (linked) {
			logError(Strings.migrate_log_known);
			await interaction.editReply({ content: Strings.migrate_known_mcuuid_part1 + uuid + Strings.migrate_known_mcuuid_part2 + linked.owner + Strings.migrate_known_mcuuid_part3 });
			return;
		}

		await client.db.whitelist.create({
			data: {
				whitelisted: 1,
				name: nick,
				uuid
			}
		});

		await accounts.create({
			data: {
				mcuuid: uuid,
				owner: target.resolved.discordsnowflakeid,
				playtime: "{}"
			}
		});

		logInfo(Strings.migrate_log_success, interaction.user.displayName, nick, uuid);

		await interaction.editReply({ content: Strings.migrate_success_part1 + target.resolved.discordsnowflakeid + Strings.migrate_success_part2 + nick + Strings.migrate_success_part3 + uuid + Strings.migrate_success_part4 });
	}

	catch (e) {
		logErrorMsg(e, Strings.migrate_log_error)
		await interaction.editReply({
			content: Strings.migrate_error_public,
		});
	}
}

async function loadMojangUUID(nick: string): Promise<string> {
	try {
		return (await (
			await fetch("https://playerdb.co/api/player/minecraft/" + nick
            /*Let's pray that Discord does some basic sanitization, like removing BCSPs, NULLs, and anything else that could be used for an exploit (but as such shouldn't belong in a user-enterable command, either).*/)).json(
		) as { data: { player: { id: string } } }).data.player.id;
	}
	catch {
		return "WRONG!"
	}
}