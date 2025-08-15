import {
    ChatInputCommandInteraction,
    PermissionsBitField,
    SlashCommandBuilder
} from "discord.js";

import { logErrorMsg } from "functions/logger.js";
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
    
    try{
        const users = client.db.users;
        const nick  = interaction.options.getString("nick", true);
        const uuid  = interaction.options.getString("uuid", false) || (await (await fetch("https://playerdb.co/api/player/minecraft/"+nick /*Let's pray that Discord does some basic sanitisation, like removing BCPSs, BELLs, NULLs, and anything else that doesn't belong in a URL (but shouldn't belong in a user-enterable command, either).*/)).json() as {data: {player: {id: string}}}).data.player.id;
        
        if (await users.findUnique({ where: { discordsnowflakeid: interaction.user.id } })){
            await interaction.editReply({
                content: `Już zarejestrowano!`,
            });
            return;
        }
        
        if (await users.findUnique({ where: { mcname: nick } }) || await users.findUnique({ where: { mcuuid: uuid } })){
            await interaction.editReply({
                content: `Konto MC w użyciu!`,
            });
            return;
        }
        
        await client.db.whitelist.create({data: {
            whitelisted: 1,
            name: nick,
            uuid
        }});
        
        await users.create({data: {
            discordsnowflakeid: interaction.user.id,
            mcname: nick,
            mcuuid: uuid
        }});
        
        await interaction.editReply({
            content: `Zarejestrowano! UUID: \`${uuid}\``,
        });
    }
    
    catch (e) {
        logErrorMsg(e, "err")
        await interaction.editReply({
            content: `BŁĄD!`,
        });
    }
}