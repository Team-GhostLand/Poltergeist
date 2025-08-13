import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";

import Bot from "../../classes/Bot.js";
import Strings from "../../strings.json" assert { type: "json" };

export const data = {
  ...new SlashCommandBuilder()
    .setName("panel")
    .setDescription(Strings.verify_panel_command_desc)
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .setDMPermission(false)
    .addChannelOption((option) =>
      option
        .setName("na")
        .setDescription(Strings.verify_panel_command_param_channel_desc)
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .toJSON(),
};

export async function run(
  client: Bot,
  interaction: ChatInputCommandInteraction
) {
  // Get channel to send the panel to
  const channel = interaction.options.getChannel("na", true) as TextChannel;
  // Create the panel
  const verifyPanel = new EmbedBuilder()
    .setTitle(Strings.verify_panel_header)
    .setDescription(Strings.verify_panel_content);
  // Create action row with buttons
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("verifyAccount")
      .setLabel(Strings.verify_panel_button_ms)
      .setStyle(ButtonStyle.Primary)
      .setEmoji("861662603691950101"),
    new ButtonBuilder()
      .setCustomId("recruitAccount")
      .setLabel(Strings.verify_panel_button_rc)
      .setStyle(ButtonStyle.Primary)
      .setEmoji("👮")
  );
  // Send the panel
  await channel.send({
    embeds: [verifyPanel],
    components: [actionRow],
  });

  // Send success message
  await interaction.reply({
    content: Strings.verify_panel_command_confirmation_message,
    ephemeral: true,
  });
}
