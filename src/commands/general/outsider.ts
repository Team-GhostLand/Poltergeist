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
    .setName("outsider")
    .setDescription("Dodaje rolę outsider niezweryfikowanemu użytkownikowi")
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

  const outsider = await prisma.outsider.findUnique({
    where: {
      id: member.id,
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
      userId: true,
    },
  });

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle("Dodawanie Outsidera")
    .setTimestamp();

  if (
    !user &&
    !(interaction.member?.permissions as Readonly<PermissionsBitField>).has(
      PermissionsBitField.Flags.Administrator
    )
  ) {
    embed
      .setDescription(
        `W celu użycia tej komendy musisz być zweryfikowany!\n> Możesz to zrobić używając panelu dostępnego na kanale <#213742069>`
      )
      .setColor(Colors.Red);
  }
  if (
    (user ||
      (interaction.member?.permissions as Readonly<PermissionsBitField>).has(
        PermissionsBitField.Flags.Administrator
      )) &&
    outsider
  ) {
    embed
      .setTitle("Informacje o użytkowniku")
      .setDescription(
        `Informacje o użytkowniku <@${outsider.id}>:\n> Dodany przez: <@${
          outsider.userId
        }>\n> Data dodania: <t:${Math.floor(
          outsider.createdAt.getTime() / 1000
        )}:f>`
      )
      .setColor(Colors.Green);
  }
  if (
    (user ||
      (interaction.member?.permissions as Readonly<PermissionsBitField>).has(
        PermissionsBitField.Flags.Administrator
      )) &&
    !outsider
  ) {
    await prisma.outsider.create({
      data: {
        id: member.id,
        username: member.user.username,
        userId: interaction.user.id,
      },
    });
    await member.roles.add("1148308933623152733");
    embed
      .setDescription(
        `Użytkownik <@${member.id}> otrzymał rolę outsidera!\n> Daje mu ona dostęp do części kanałów przeznaczonych dla uczniów.`
      )
      .setColor(Colors.Green);
  }

  // Create new action row
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("deleteOutsider")
      .setLabel("Usuń outsidera")
      .setDisabled(
        !outsider ||
          (outsider?.userId !== interaction.user.id &&
            !(
              interaction.member?.permissions as Readonly<PermissionsBitField>
            ).has(PermissionsBitField.Flags.Administrator))
      )
      .setStyle(ButtonStyle.Danger)
  );

  // Send success message
  const reply = await interaction.reply({
    embeds: [embed],
    components: user && outsider ? [actionRow] : [],
    ephemeral: false,
    fetchReply: true,
  });

  // Create collector
  const collector = reply.createMessageComponentCollector({
    filter: (i) =>
      i.customId === "deleteOutsider" && i.user.id === interaction.user.id,
    time: 30000,
  });
  collector.on("collect", async (i) => {
    await i.deferUpdate();
    await prisma.outsider.delete({
      where: {
        id: member.id,
      },
    });
    await member.roles.remove("1148308933623152733");
    await i.followUp({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `Użytkownik <@${member.id}> stracił rolę outsidera!\n> Nie ma on już dostępu do części kanałów przeznaczonych dla uczniów.`
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
