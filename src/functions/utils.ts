import {
	APIInteractionDataResolvedGuildMember,
	APIInteractionGuildMember,
	ButtonInteraction,
	Channel,
	Collection,
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
import { lstatSync, readdirSync } from "fs";
import { join } from "path";
import Bot from "../classes/Bot.js";
import { logError, logErrorMsg, logInfo } from "./logger.js";

import { mainCodeDir } from "index.js";
import Strings from "../strings.json" with { type: "json" };

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
        try{
            bot.db.$disconnect();
        }
        catch (e){
            logErrorMsg(e, Strings.logs_prisma_stop_failed)
        }
        bot.destroy();
    }
    process.exit(code);
}

export async function loadHandlers(isCommand: boolean, from?: { dir: string, displayname: string }): Promise<Collection<string, any>> {
    
    if (!from){ 
        if (isCommand) return loadHandlers(true, {dir: join(mainCodeDir, "commands"), displayname: "CMD"});
        else {
            logError(Strings.logs_registry_error);
            return new Collection<string, any>;
        }
    }
    
    logInfo(Strings.logs_registry_begin + from.displayname);
    const commandFolder = readdirSync(from.dir);
    let output = new Collection<string, any>();
    
    for (const subfolderOrCommandFile of commandFolder) {
        
        let fullPathOfSubfolderOrCommandFile = join(from.dir, subfolderOrCommandFile)
        
        if(lstatSync(fullPathOfSubfolderOrCommandFile).isDirectory()){
            output = output.concat(await loadHandlers(isCommand, {dir: fullPathOfSubfolderOrCommandFile, displayname: from.displayname+":"+subfolderOrCommandFile}));
            continue;
        }
        
        if (!fullPathOfSubfolderOrCommandFile.endsWith(".ts")) continue;
        
        const command = await import(fullPathOfSubfolderOrCommandFile);
        
        let name = subfolderOrCommandFile.slice(0, -3); //Simple name generation: from the filename
        if (isCommand) name = command.data.name;        //Fancier name generation: from the command itself (commands only)
        
        output.set(name, command);
        logInfo(Strings.logs_registry_found + name+"@"+from.displayname);
    }
    
    return output;
}

export async function getOrCreateUserFromId(client: Bot, id: string, reason: "JOIN_EVENT"|"TRUSTY_COMMAND"|"NORMAL_COMMAND"|"DANGLING_INVITER"|"BOT_ITSELF") {
	let user = client.db.users.findUnique({ where: {discordsnowflakeid: id} });
	if (id === client.user?.id) { reason = "BOT_ITSELF"; } //Just in case someone tries to call this function for the bot itself with some other reason.

	if (!(await user)) {
		logInfo("User " + id + " doesn't seem to have any GhostLand account at all - creating a new one for them (reason: " + reason + ")...");
		
		let trustReason;
		if (reason === "TRUSTY_COMMAND") trustReason = Strings.trust_auto_command; //If you are able to run this bot's commands, you must've had the trusted role before, already. Either that, or someone issued a command on you that automatically implies trust (unlike NORMAL_COMMAND, which can happen under any circumstances), eg. the trust command-itself, or as part of some query that could realistically only happen if you're trusted.
		else if (reason === "DANGLING_INVITER") trustReason = Strings.trust_auto_dangling_inviter; //If you were able to send invites, you must've had the trusted role before, already.
		else if (reason === "BOT_ITSELF") trustReason = Strings.trust_auto_self; //The bot itself is always trusted.
		
		let approver;
		if (trustReason){
			if (reason !== "BOT_ITSELF") approver = (await getOrCreateUserFromId(client, client.user!.id, "BOT_ITSELF")).resolved?.discordsnowflakeid;
			else approver = id; //The bot is approving itself. Can't use getOrCreateUserFromId again, or we'll end up in an infinite loop.

			if (!approver) logError("Critical error: couldn't find or create the bot's own user entry in the database while trying to set it as approver for a new trusted user.");
		}

		let inviter = client.user!.id; /*Temporary: setting the bot as inviter for all new users, until Discord gets their shit together. Turns out that their new special-little-pretty „Members” tab, that shows all sorts of very useful information, including who invited a given user, is not exposed via the bot API yet. AAAAAA! I wanted to have this beautiful recursive loop, where for this very func would be called for everyone up in the invite chain, thus doing automatic backfill for all from-the-old-system accounts, until we eventually find either someone who's already in the DB, or reach the „elders” (ppl so old that they weren't yet tracked by this system) and mark them as invited by this very bot. That's what the „DANGLING_INVITER” reason was for. But no; fuck me, I guess!!! Now everyone is marked as invited by this bot, and DANGLING_INVITER is itself dangling (ironic). Fuckin'... Thanks, Dick's Cord!*/;
		if ((inviter === client.user?.id) && (reason !== "BOT_ITSELF")){
			//This is all done to ensure that the bot will exist, if set as a fallback for unresolvable invites (which - as stated above - is currently all of them). Without this check, we end up running into FKey concerns. The „don't do this if the reason is BOT_ITSELF”-check is there to ensure we don't run into an infinite loop of the bot trying to create an account for itself.
			if (!((await getOrCreateUserFromId(client, client.user!.id, "BOT_ITSELF")).resolved)) logError("Critical error: couldn't find or create the bot's own user entry in the database while trying to set it as inviter for a user with an unknown invite.");
		}

		let err: string|unknown = "[UNKNOWN ERROR]";
		user = client.db.users.create({data: {discordsnowflakeid: id, reason: trustReason, approvedBy: approver, invitedBy: inviter}});	
		const userErrorable = user.catch((e) => {err = e; return null;});

		if (!(await userErrorable)) {
			/**@ts-ignore */
			user = userErrorable;
		}

		if (!(await user)){
			logErrorMsg(err, "Critical error: couldn't create a new GhostLand user entry in the database for user " + id + " because of error:");
		} else{
			logInfo("Successfully created a new GhostLand user entry in the database for user " + id);
		};
	}

	return {raw: user, resolved: await user};
}

export async function getOrCreateUserAndSyncTrust(client: Bot, member: GuildMember|APIInteractionGuildMember|APIInteractionDataResolvedGuildMember|null|undefined, reason: "JOIN_EVENT"|"TRUSTY_COMMAND"|"NORMAL_COMMAND"|"DANGLING_INVITER"|"BOT_ITSELF") {
	const uid = !member ? null : ("id" in member ? member.id : ( "user" in member ? member.user.id : null));
	
	if (!uid || !member) {
		let nick = (member as APIInteractionGuildMember|APIInteractionDataResolvedGuildMember|null|undefined)?.nick
		if (!nick) nick = "nor even a nickname, for that matter - so there is no way to even debug whose weird-ass privacy settings caused this"; 
		logError("Critical error: getOrCreateUserAndSyncTrust was passed a member for whom no SnowflakeID could be extracted ("+nick+"), when processing "+reason+". Likely a null/undefined, an APIInteractionGuildMember (created as part of a MESSAGE_CREATE or MESSAGE_UPDATE) gateway event, or an APIInteractionDataResolvedGuildMember.");
		return {raw: new Promise((resolve, reject) => {resolve(null);}) as Promise<null>, resolved: null};
	}

	const userRaw = await getOrCreateUserFromId(client, uid, reason);
	const user = userRaw.resolved;
	if (!user) return {raw: userRaw.raw, resolved: user};
	const approvalReason = (user.approvedBy || (user.altOf + " (as alt)"))+" because of: "+user.reason;

	if (Array.isArray(member.roles)) {
		logError("An APIInteractionGuildMember or APIInteractionDataResolvedGuildMember of user " + uid + " was passed to getOrCreateUserAndSyncTrust (when processing "+reason+"), instead of a GuildMember. User was returned, but roles sync will not be performed -> consider using a simpler getOrCreateUserFromId instead.");
		return {raw: userRaw.raw, resolved: user};
	}

	if ((user.approvedBy || user.altOf) && user.reason) {
		if (!member.roles.cache.has(Strings.trusted_role)) {
			logInfo("User " + uid + " is now trusted (reason: " + reason + " // thanks to " + approvalReason + "). Adding trusted role.");
			member.roles.add(Strings.trusted_role);
		}
		if (member.roles.cache.has(Strings.untrusted_role)) {
			logInfo("User " + uid + " is no longer untrusted (reason: " + reason + " // thanks to " + approvalReason + "). Removing untrusted role.");
			member.roles.remove(Strings.untrusted_role);
		}
	} else {
		if (member.roles.cache.has(Strings.trusted_role)) {
			logInfo("User " + uid + " is not trusted (reason: " + reason + "). Removing trusted role.");
			member.roles.remove(Strings.trusted_role);
		}
		if (!member.roles.cache.has(Strings.untrusted_role)) {
			logInfo("User " + uid + " is not trusted (reason: " + reason + "). Adding untrusted role.");
			member.roles.add(Strings.untrusted_role);
		}
	}

	return {raw: userRaw.raw, resolved: user};
}