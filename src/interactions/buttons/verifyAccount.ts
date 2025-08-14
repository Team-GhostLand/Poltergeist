import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder
} from "discord.js";
import Bot from "../../classes/Bot.js";

export const run = async (client: Bot, interaction: ButtonInteraction) => {
  await interaction.deferReply({ ephemeral: true });
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle("[TO BE REMOVED]")
    .setDescription("[TO BE REMOVED]")
    .setColor("#00ff00")
    .setTimestamp();

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("[TO BE REMOVED]")
      .setStyle(ButtonStyle.Link)
      .setURL("https://ghostland.ovh")
  );

  // Send embed
  await interaction.editReply({
    embeds: [embed],
    components: [actionRow],
  });
};
