import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";

import Bot from "../../classes/Bot.js";
import prisma from "../../functions/prisma.js";
import Strings from "../../strings.json" assert { type: "json" };

export const data = {
  ...new SlashCommandBuilder()
    .setName("klasa")
    .setDescription("Wysyła informacje o tobie/innym użytkowniku")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("klasa")
        .setDescription("Klasa, której użytkowników chcesz sprawdzić.")
        .setRequired(false)
    )
    .toJSON(),
};

export async function run(
  client: Bot,
  interaction: ChatInputCommandInteraction
) {
  // Get channel to send the panel to
  const className = (
    interaction.options.getString("klasa") as string
  )?.toUpperCase();

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
    },
  });
  
  const classMembers = await prisma.user.findMany({
    where: {
      class: className ? className : user?.class,
    },
    select: {
      id: true,
      name: true,
      email: true,
      class: true,
      role: true,
    },
  });

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(Strings.class_command_embed_header)
    .setTimestamp();

  if (!user && !className) {
    embed
      .setDescription(Strings.class_command_unverified)
      .setColor(Colors.Red);
  }
  if (
    (user || className) &&
    className &&
    !(interaction.member?.permissions as Readonly<PermissionsBitField>).has(
      PermissionsBitField.Flags.Administrator
    )
  ) {
    embed
      .setDescription(Strings.class_command_not_member)
      .setColor(Colors.Red);
  }
  if (
    (user || className) &&
    !classMembers.length &&
    (!className ||
      (interaction.member?.permissions as Readonly<PermissionsBitField>).has(
        PermissionsBitField.Flags.Administrator
      ))
  ) {
    embed
      .setDescription(
        Strings.class_command_class_empty_part1+className+Strings.class_command_class_empty_part2
      )
      .setColor(Colors.Red);
  }
  if (
    (user || className) &&
    classMembers.length &&
    (!className ||
      (interaction.member?.permissions as Readonly<PermissionsBitField>).has(
        PermissionsBitField.Flags.Administrator
      ))
  ) {
    embed
      .addFields([
        //TODO: Add teacher support
        {
          name: Strings.class_command_role_gospodarz,
          value: `> ${
            classMembers.find((member) => member.role == 0)?.name || Strings.class_command_role_deptgospodarz_empty
          }`,
          inline: true,
        },
        {
          name: Strings.class_command_role_deptgospodarz,
          value: `> ${
            classMembers.find((member) => member.role == 1)?.name || Strings.class_command_role_deptgospodarz_empty
          }`,
          inline: true,
        },
        {
          name: Strings.class_command_role_skarbnik,
          value: `> ${
            classMembers.find((member) => member.role == 2)?.name || Strings.class_command_role_skarbnik_empty
          }`,
          inline: true,
        },
        {
          name: Strings.class_command_role_connector,
          value: `> ${
            classMembers.find((member) => member.role == 4)?.name || Strings.class_command_role_connector_empty
          }`,
          inline: true,
        },
        {
          name: Strings.class_command_role_none,
          value: `> ${
            classMembers
              .filter((member) => member.role == 3)
              .map((member) => `<@${member.id}>`)
              .join(", ") || Strings.class_command_role_none_empty
          }`,
          inline: false,
        },
      ])
      .setColor(Colors.Green);
  }

  // Send success message
  await interaction.reply({
    embeds: [embed],
    ephemeral: false,
  });
}
