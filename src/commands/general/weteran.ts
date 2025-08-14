import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";

import Bot from "../../classes/Bot.js";
import prisma from "../../functions/prisma.js";

export const data = {
    ...new SlashCommandBuilder()
        .setName("weteran")
        .setDescription("Dodaje rolę wteran niezweryfikowanemu użytkownikowi")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false)
        .addUserOption((option) =>
            option
                .setName("uzytkownik")
                .setDescription("Użytkownik, któremu ma zostać przydzielona rola")
                .setRequired(true)
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
            id: interaction.user.id,
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

    const weteran = await prisma.weteran.findUnique({
        where: {
            id: member.id,
        },
        select: {
            id: true,
            username: true,
            createdAt: true,
            adminId: true,
        },
    });

    // Create embed
    const embed = new EmbedBuilder()
        .setTitle("Dodawanie Weterana")
        .setTimestamp();

    if (!user) {
        embed
            .setDescription(
                `W celu użycia tej komendy musisz być zweryfikowany!\n> Możesz to zrobić używając panelu dostępnego na kanale <#213742069>`
            )
            .setColor(Colors.Red);
    }
    if (user && weteran) {
        embed
            .setTitle("Informacje o użytkowniku")
            .setDescription(
                `Informacje o użytkowniku <@${weteran.id}>:\n> Dodany przez: <@${
                    weteran.adminId
                }>\n> Data dodania: <t:${Math.floor(
                    weteran.createdAt.getTime() / 1000
                )}:f>`
            )
            .setColor(Colors.Green);
    }
    if (user && !weteran) {
        await prisma.weteran.create({
            data: {
                id: member.id,
                username: member.user.username,
                adminId: interaction.user.id,
            },
        });
        await member.roles.add("1018185474872975471");
        embed
            .setDescription(
                `Użytkownik <@${member.id}> otrzymał rolę weterana!\n> Daje mu ona dostęp do części kanałów przeznaczonych dla uczniów.`
            )
            .setColor(Colors.Green);
    }

    // Create new action row
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("deleteWeteran")
            .setLabel("Usuń weterana")
            .setDisabled(!weteran)
            .setStyle(ButtonStyle.Danger)
    );

    // Send success message
    const reply = await interaction.reply({
        embeds: [embed],
        components: user && weteran ? [actionRow] : [],
        ephemeral: false,
        fetchReply: true,
    });

    // Create collector
    const collector = reply.createMessageComponentCollector({
        filter: (i) =>
            i.customId === "deleteWeteran" && i.user.id === interaction.user.id,
        time: 30000,
    });
    collector.on("collect", async (i) => {
        await i.deferUpdate();
        await prisma.weteran.delete({
            where: {
                id: member.id,
            },
        });
        await member.roles.remove("1018185474872975471");
        await i.followUp({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `Użytkownik <@${member.id}> stracił rolę weterana!\n> Nie ma on już dostępu do części kanałów przeznaczonych dla uczniów.`
                    )
                    .setColor(Colors.Green),
            ],
            components: [],
        });
        collector.stop();
    });
    collector.on("end", async (i) => {
        reply.edit({
            components: [],
        });
    });
}