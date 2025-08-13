import Cryptr from "cryptr";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  GuildMemberRoleManager,
} from "discord.js";
import Bot from "../../classes/Bot.js";
import prisma from "../../functions/prisma.js";
import { classNameToClassId, findRole } from "../../functions/utils.js";

const cryptr = new Cryptr(process.env.SECRET_TOKEN!);

export const run = async (client: Bot, interaction: ButtonInteraction) => {
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
    await prisma.user.upsert({
      where: {
        id: interaction.user.id,
      },
      update: {
        class: userData.class,
        role: userData.role,
        isPublic: userData.isPublic,
      },
      create: {
        id: interaction.user.id,
        name: userData.name,
        email: userData.email,
        class: userData.class, //TODO: Migrate this away to classId
        classId: classNameToClassId(userData.class), //TODO: Make it post a reply from the server instead
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

    // Remove unverified role
    await (interaction.member?.roles as GuildMemberRoleManager).remove(
      "1149077668873125978"
    );
  }

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle("Weryfikacja kontem Microsoft")
    .setDescription(
      isVerified
        ? `Weryfikacja zakończona sukcesem!\n> Połączone konto: **${userData.name}**`
        : `Kliknij przycisk poniżej, aby przejść do strony weryfikacji.`
    )
    .setColor("#00ff00")
    .setTimestamp();

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(
        isVerified ? "Zaktualizuj dane" : "Weryfikacja kontem Microsoft"
      )
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );

  // Send embed
  await interaction.editReply({
    embeds: [embed],
    components: [actionRow],
  });
};
