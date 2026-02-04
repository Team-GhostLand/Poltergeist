import {
	ChatInputCommandInteraction,
	PermissionsBitField,
	SlashCommandBuilder
} from "discord.js";

import { logCommand, logError, logErrorMsg, logInfo } from "functions/logger.js";
import { getOrCreateUserAndSyncTrust } from "functions/utils.js";
import Bot from "../classes/Bot.js";
import Strings from "../strings.json" with { type: "json" };

export const data = { ...new SlashCommandBuilder()
	.setName("zaufaj")
	.setDescription(Strings.trustcmd_description)
	.setDefaultMemberPermissions(PermissionsBitField.Flags.UseApplicationCommands)
	.setDMPermission(false)
	.addUserOption((option) => option
		.setName("komu")
		.setDescription(Strings.trustcmd_field_description_target)
		.setRequired(true)
	)
	.addStringOption((option) => option
		.setName("ponieważ")
		.setDescription(Strings.trustcmd_field_description_reason)
		.setRequired(true)
	)
	.toJSON(),
};

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
	await interaction.deferReply();
	
	try{
		const users = client.db.users;
		const sender  = (await getOrCreateUserAndSyncTrust(client, interaction.member, "TRUSTY_COMMAND")).resolved;
		const target  = await interaction.guild?.members.fetch(interaction.options.getUser("komu", true));
		const reason  = interaction.options.getString("ponieważ", true);
		
		if (!sender) {
			logError(Strings.trustcmd_log_no_sender);
			await interaction.editReply({ content: Strings.trustcmd_error_public });
			return;
		} else if (!target) {
			//The only way for target to be null, is if interaction.guild as a whole was null. getUser() will not be null (unless something's gone hilariously wrong) because it's the non-nullable (required: true) variant of that func. Hence the error is about the guild being missing, not the target.
			logError(Strings.trustcmd_log_no_guild);
			await interaction.editReply({ content: Strings.trustcmd_error_no_guild });
			return;
		} else if (!(await getOrCreateUserAndSyncTrust(client, target, "NORMAL_COMMAND"))) {
			logError(Strings.trustcmd_log_no_target);
			await interaction.editReply({ content: Strings.trustcmd_error_public });
			return;
		} else {
			logCommand(interaction.member?.user.username + Strings.trustcmd_log_approves_part1 + target.user.username + Strings.trustcmd_log_approves_part2 + reason);
		}

		await users.update({
			where: { discordsnowflakeid: target.id },
			data: {
				reason: reason,
				approvedBy: sender.discordsnowflakeid
			}
		});
		
		await interaction.editReply({ content: (Strings.trustcmd_success_part1 + (await getOrCreateUserAndSyncTrust(client, target, "TRUSTY_COMMAND")).resolved?.discordsnowflakeid + Strings.trustcmd_success_part2 + reason + Strings.trustcmd_success_part3) });
		logInfo(target.user.username + Strings.trustcmd_log_success);
	}
	
	catch (e) {
		logErrorMsg(e, Strings.trustcmd_log_error)
		await interaction.editReply({
			content: Strings.trustcmd_error_public,
		});
	}
}