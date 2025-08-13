import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  GuildMemberRoleManager,
  SlashCommandBuilder,
} from "discord.js";

import Cryptr from "cryptr";
import Bot from "../../classes/Bot.js";
import prisma from "../../functions/prisma.js";
import { findRole } from "../../functions/utils.js";

const cryptr = new Cryptr(process.env.SECRET_TOKEN!);

export const data = {
  ...new SlashCommandBuilder()
    .setName("ustawienia")
    .setDescription("Wysyła link do edycji ustawień konta")
    .setDMPermission(false)
    .toJSON(),
};

export async function run(
  client: Bot,
  interaction: ChatInputCommandInteraction
) {
  await interaction.deferReply({ ephemeral: true });

  // Encrypt discordId
  const encryptedString = cryptr.encrypt(interaction.user.id);

  // Generate url
  const url = `http://localhost:3000/?secret=${encryptedString}`;

  // Check if user is already verified
  let isVerified = false,
    userData;
  const response = await fetch(
    `${process.env.FRONT_URL}/api/user?secret=${process.env.SECRET_TOKEN}&discordId=${interaction.user.id}`
  );
  if (response.status === 200) {
    isVerified = true;
    userData = await response.json();
    await prisma.user.update({
      where: {
        id: interaction.user.id,
      },
      data: {
        class: userData.class,
        role: userData.role,
        isPublic: userData.isPublic,
      },
    });

    const userRoles = (
      interaction.member?.roles as GuildMemberRoleManager
    ).cache.map((role) => {
      return {
        id: role.id,
        name: role.name,
      };
    });
    for (const role of userRoles) {
      if (
        role.name.length === 2 &&
        ["1", "2", "3", "4"].includes(role.name.split("")[0]) &&
        ["A", "B", "C", "D", "E", "F"].includes(role.name.split("")[1])
      ) {
        if (role.name === userData.class) continue;
        await (interaction.member?.roles as GuildMemberRoleManager).remove(
          role.id
        );
      }
    }

    const classRole = findRole(interaction.guild!, userData.class);
    if (classRole) {
      await (interaction.member?.roles as GuildMemberRoleManager).add(
        classRole.id
      );
    }
  }

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle("Aktualizacja ustawień konta")
    .setTimestamp();

  if (!isVerified) {
    embed
      .setDescription(
        `W celu użycia tej komendy musisz być zweryfikowany!\n> Możesz to zrobić używając panelu dostępnego na kanale <#213742069>`
      )
      .setColor(Colors.Red);
  }
  if (isVerified) {
    embed
      .setDescription(
        `*Twoje dane zostały zsychronizowane!*\n\nKliknij przycisk poniżej żeby zaktualizować swoje ustawienia!\n> __**Po zmianie ustawień na stronie, użyj komendy ponownie!**__`
      )
      .setColor(Colors.Green);
  }

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Zaktualizuj ustawienia")
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );

  // Send success message
  await interaction.editReply({
    embeds: [embed],
    components: isVerified ? [actionRow] : undefined,
  });
}
