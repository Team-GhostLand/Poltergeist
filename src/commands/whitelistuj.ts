import {
	ChatInputCommandInteraction,
	MessageFlags,
	PermissionsBitField,
	SlashCommandBuilder
} from "discord.js";

import { logError, logErrorMsg, logInfo } from "functions/logger.js";
import { getOrCreateUserAndSyncTrust } from "functions/utils.js";
import Bot from "../classes/Bot.js";
import Strings from "../strings.json" with { type: "json" };

export const data = {
	...new SlashCommandBuilder()
		.setName("whitelistuj")
		.setDescription(Strings.whitelist_description)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.UseApplicationCommands)
		.setDMPermission(false)
		.addStringOption((option) => option
			.setName("nick")
			.setDescription(Strings.whitelist_field_description_nick)
			.setRequired(true)
		)
		.addStringOption((option) => option
			.setName("powód_alta")
			.setDescription(Strings.whitelist_field_description_reason)
			.setRequired(false)
		)
		.toJSON(),
};

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	try {
		const accounts = client.db.accounts;
		const sender = await getOrCreateUserAndSyncTrust(client, interaction.member, "TRUSTY_COMMAND");
		const nick = interaction.options.getString("nick", true);
		const uuid = await loadMojangUUID(nick);
		const reason = interaction.options.getString("powód_alta");

		if (!sender.resolved) {
			logError(Strings.whitelist_log_no_sender);
			await interaction.editReply({ content: Strings.whitelist_error_public });
			return;
		}

		const linked = await accounts.findUnique({ where: { mcuuid: uuid } });
		console.log("awaited dupes");
		const mcaccounts = await sender.raw.mcaccounts();
		console.log("awaited alts");

		if (sender.resolved.altOf) {
			logError(Strings.whitelist_log_dcalt);
			await interaction.editReply({ content: Strings.whitelist_error_dcalt });
			return;
		} else if (uuid === "WRONG!") {
			logError(Strings.whitelist_log_invalid);
			await interaction.editReply({ content: Strings.whitelist_invalid });
			return;
		} else if (linked) {
			logError(Strings.whitelist_log_known);
			await interaction.editReply({ content: Strings.whitelist_known_mcuuid_part1 + uuid + Strings.whitelist_known_mcuuid_part2 + linked.owner + Strings.whitelist_known_mcuuid_part3 });
			return;
		} else if (mcaccounts && mcaccounts.length > 0 && !reason) {
			logError(Strings.whitelist_log_toomanyalts);
			await interaction.editReply({ content: Strings.whitelist_error_toomanyalts });
			return;
		}

		console.log("Got all the way here!");

		await client.db.whitelist.create({
			data: {
				whitelisted: 1,
				name: nick,
				uuid
			}
		});

		console.log("...and beyond!!!");

		await accounts.create({
			data: {
				mcuuid: uuid,
				owner: sender.resolved.discordsnowflakeid,
				playtime: "{}",
				altreason: reason
			}
		});

		console.log("Probably not here, tho.");

		logInfo(Strings.whitelist_log_success, interaction.user.displayName, nick, uuid);

		await interaction.editReply({ content: Strings.whitelist_success_part1 + sender.resolved.discordsnowflakeid + Strings.whitelist_success_part2 + nick + Strings.whitelist_success_part3 + uuid + Strings.whitelist_success_part4 });
	}

	catch (e) {
		logErrorMsg(e, Strings.whitelist_log_error)
		await interaction.editReply({
			content: Strings.whitelist_error_public,
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