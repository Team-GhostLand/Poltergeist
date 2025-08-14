import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";

import Bot from "../../classes/Bot.js";
import prisma from "../../functions/prisma.js";
import { roleList } from "../../functions/utils.js";

export const data = {
    ...new SlashCommandBuilder()
        .setName("kto")
        .setDescription("Wysyła informacje o tobie/innym użytkowniku")
        .setDMPermission(false)
        .addUserOption((option) =>
            option
                .setName("uzytkownik")
                .setDescription("Użytkownik, którego dane chcesz sprawdzić")
                .setRequired(false)
        )
        .toJSON(),
};

export async function run(
    client: Bot,
    interaction: ChatInputCommandInteraction
) {
    // Get channel to send the panel to
    const member = interaction.options.getMember("uzytkownik") as GuildMember;

    const user = await prisma.user.findUnique({
        where: {
            id: member?.id || interaction.user.id,
        },
        select: {
            id: true,
            name: true,
            email: true,
            class: true,
            role: true,
            isPublic: true,
        },
    });

    // Create embed
    const embed = new EmbedBuilder()
        .setTitle("Informacje o użytkowniku")
        .setTimestamp();

    if (!user) {
        embed
            .setDescription(
                `Użytkownik <@${
                    member?.id || interaction.user.id
                }> nie jest weryfikowany!\n> Może się on(a) zweryfikować używając panelu dostępnego na kanale <#213742069>`
            )
            .setColor(Colors.Red);
    }
    if (
        user &&
        !user.isPublic &&
        !(interaction.member?.permissions as Readonly<PermissionsBitField>).has(
            PermissionsBitField.Flags.Administrator
        )
    ) {
        embed
            .setDescription(
                `Użytkownik <@${
                    member?.id || interaction.user.id
                }> ukrył(a) swoje dane!\n> Jedynie osoby z tej samej klasy mogą sprawdzić informacje o tym użytkowniku.`
            )
            .setColor(Colors.Red);
    }
    if (
        user &&
        (user.isPublic ||
            (interaction.member?.permissions as Readonly<PermissionsBitField>).has(
                PermissionsBitField.Flags.Administrator
            ))
    ) {
        embed
            .setDescription(
                `Informacje o użytkowniku <@${
                    member?.id || interaction.user.id
                }>:\n> **Imię i Nazwisko:** __${user.name}__\n> **Klasa:** __${
                    user.class
                }__\n> **Rola w klasie:** __${roleList[user.role]}__`
            )
            .setColor(Colors.Green);
    }

    // Send success message
    await interaction.reply({
        embeds: [embed],
        ephemeral: false,
    });
}