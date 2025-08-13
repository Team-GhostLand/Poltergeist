import Bot from "classes/Bot.js";
import {
  ButtonInteraction,
  EmbedBuilder,
  GuildMemberRoleManager,
} from "discord.js";

export const run = async (client: Bot, interaction: ButtonInteraction) => {
  // Check if user has Recruit role
  const hasRecruitRole = (
    interaction.member?.roles as GuildMemberRoleManager
  ).cache.has("1148300495585300601");
  if (hasRecruitRole) {
    await interaction.reply({
      content: "Już masz rolę Rekruta!",
      ephemeral: true,
    });
    return;
  }

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle("Rola rekruta")
    .setDescription("Pomyślnie przypisano Ci rolę <@&1148300495585300601>!")
    .setColor("#00ff00")
    .setTimestamp();

  // Add Recruit role
  await (interaction.member?.roles as GuildMemberRoleManager).add(
    "1148300495585300601"
  );

  // Send embed
  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
};
