import Bot from "classes/Bot.js";
import { GuildMember } from "discord.js";
import { logInfo } from "functions/logger";
import { getOrCreateUserAndSyncTrust } from "functions/utils";

export async function run(client: Bot, member: GuildMember) {
    logInfo(`New member joined: ${member.user.tag} (${member.id})`);
	getOrCreateUserAndSyncTrust(client, member, "JOIN_EVENT");
}