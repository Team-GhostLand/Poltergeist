import Bot from "classes/Bot.js";
import {
    ButtonInteraction,
    EmbedBuilder
} from "discord.js";

export const run = async (client: Bot, interaction: ButtonInteraction) => {
  // Check if... Nothing. This is always false
  if (false) {
    await interaction.reply({
      content: "[TO BE REMOVED]",
      ephemeral: true,
    });
    return;
  }

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle("[TO BE REMOVED]")
    .setDescription("[TO BE REMOVED]")
    .setColor("#00ff00")
    .setTimestamp();

  // Send embed
  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
};
