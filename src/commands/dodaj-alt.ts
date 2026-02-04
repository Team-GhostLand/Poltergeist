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
	.setName("dodaj-alt")
	.setDescription(Strings.addalt_description)
	.setDefaultMemberPermissions(PermissionsBitField.Flags.UseApplicationCommands)
	.setDMPermission(false)
	.addUserOption((option) => option
		.setName("komu")
		.setDescription(Strings.addalt_field_description_target)
		.setRequired(true)
	)
	.addStringOption((option) => option
		.setName("ponieważ")
		.setDescription(Strings.addalt_field_description_reason)
		.setRequired(true)
	)
	.toJSON(),
};

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
	await interaction.deferReply();
	
	try{
		const sender  = (await getOrCreateUserAndSyncTrust(client, interaction.member, "TRUSTY_COMMAND")).resolved;
		const target  = await interaction.guild?.members.fetch(interaction.options.getUser("komu", true));
		const reason  = interaction.options.getString("ponieważ", true);
		const target_solved  = (await getOrCreateUserAndSyncTrust(client, target, "NORMAL_COMMAND")).resolved;
		
		//Technical guard-clauses
		if (!sender) {
			logError(Strings.addalt_log_no_sender);
			await interaction.editReply({ content: Strings.addalt_error_public });
			return;
		} else if (!target) {
			//The only way for target to be null, is if interaction.guild as a whole was null. getUser() will not be null (unless something's gone hilariously wrong) because it's the non-nullable (required: true) variant of that func. Hence the error is about the guild being missing, not the target.
			logError(Strings.addalt_log_no_guild);
			await interaction.editReply({ content: Strings.addalt_error_no_guild });
			return;
		} else if (!target_solved) {
			logError(Strings.addalt_log_no_target);
			await interaction.editReply({ content: Strings.addalt_error_public });
			return;
		} else {
			logCommand(interaction.member?.user.username + Strings.addalt_log_approves_part1 + target.user.username + Strings.addalt_log_approves_part2 + reason);
		}

		//Logical guard-clauses
		if (sender.discordsnowflakeid !== target_solved.invitedBy && false /*check disabled for now, until it's possible for us to reliably track inviters (currently, this would always be true, as everyone is technically invited by the bot)*/){
			logInfo(Strings.addalt_log_must_same_user);
			await interaction.editReply({ content: Strings.addalt_error_must_same_user });
			return;
		} else if ((target_solved.approvedBy || target_solved.altOf) && target_solved.reason){
			logInfo(Strings.addalt_log_already_trusted);
			await interaction.editReply({ content: Strings.addalt_error_already_trusted });
			return;
		} else if (sender.altOf){
			logInfo(Strings.addalt_log_is_alt);
			await interaction.editReply({ content: Strings.addalt_error_is_alt });
			return;
		}

		await client.db.users.update({
			where: { discordsnowflakeid: target.id },
			data: {
				reason: reason,
				altOf: sender.discordsnowflakeid
			}
		});
		
		await interaction.editReply({ content: (Strings.addalt_success_part1 + (await getOrCreateUserAndSyncTrust(client, target, "TRUSTY_COMMAND")).resolved?.discordsnowflakeid + Strings.addalt_success_part2 + reason + Strings.addalt_success_part3) });
		logInfo(target.user.username + Strings.addalt_log_success);
	}
	
	catch (e) {
		logErrorMsg(e, Strings.addalt_log_error)
		await interaction.editReply({
			content: Strings.addalt_error_public,
		});
	}
}