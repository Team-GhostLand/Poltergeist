import Bot from "classes/Bot.js";
import { GuildMember } from "discord.js";

export async function run(client: Bot, member: GuildMember) {
    console.log(`New member joined: ${member.user.tag} (${member.id})`);
	member.roles.add("1467236642208219218");
}