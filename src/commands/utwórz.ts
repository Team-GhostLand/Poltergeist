import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionsBitField,
    SlashCommandBuilder
} from "discord.js";

import { logError, logErrorMsg, logInfo } from "functions/logger.js";
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
    await interaction.deferReply({flags: MessageFlags.Ephemeral});
    
    try{
        const users = client.db.users;
        const user  = interaction.user.id;
        const nick  = interaction.options.getString("nick", true);
        const uuid  = interaction.options.getString("uuid", false) || await loadMojangUUID(nick);
        
        if (uuid === "WRONG!"){
            logError(Strings.create_log_invalid);
            await interaction.editReply({ content: Strings.create_invalid });
            return;
        }
        
        const errors: string[] = [];
        if(await users.findUnique({ where: { discordsnowflakeid: user } })) errors.push(Strings.create_known_discord_part1+user+Strings.create_known_discord_part2);
        
        const by_nick = await users.findUnique({ where: { mcname: nick } });
        if(by_nick) errors.push(Strings.create_known_mcname_part1+nick+Strings.create_known_mcname_part2+by_nick.discordsnowflakeid+Strings.create_known_mcname_part3);
        
        const by_uuid = await users.findUnique({ where: { mcuuid: uuid } });
        if(by_uuid) errors.push(Strings.create_known_mcuuid_part1+uuid+Strings.create_known_mcuuid_part2+by_uuid.discordsnowflakeid+Strings.create_known_mcuuid_part3);
        
        if(errors.length !== 0){
            logError(Strings.create_log_known, ...errors);
            await interaction.editReply({ content: [Strings.create_known_header, ...errors].join(Strings.create_known_combiner) });
            return;
        }
        
        await client.db.whitelist.create({data: {
            whitelisted: 1,
            name: nick,
            uuid
        }});
        
        await users.create({data: {
            discordsnowflakeid: user,
            mcname: nick,
            mcuuid: uuid
        }});
        
        logInfo(Strings.create_log_success, user, nick, uuid);
        
        await interaction.editReply({ content: (Strings.create_success_part1 + user + Strings.create_success_part2 + nick + Strings.create_success_part3 + uuid + Strings.create_success_part4) });
    }
    
    catch (e) {
        logErrorMsg(e, Strings.create_log_error)
        await interaction.editReply({
            content: Strings.create_error_public,
        });
    }
}

async function loadMojangUUID(nick: string): Promise<string>{
    try{
        return (await (
            await fetch("https://playerdb.co/api/player/minecraft/"+nick
            /*Let's pray that Discord does some basic sanitisation, like removing BCPSs, BELLs, NULLs, and anything else that doesn't belong in a URL (but shouldn't belong in a user-enterable command, either).*/)).json(
        ) as {data: {player: {id: string}}}).data.player.id;
    }
    catch{
        return "WRONG!" 
    }
}