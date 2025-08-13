import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  Interaction,
} from "discord.js";

import Bot from "../classes/Bot.js";
import { logCommand } from "../functions/logger.js";

const commandHandler = async (
  interaction: ChatInputCommandInteraction,
  client: Bot
) => {
  // // Get bot uptime in seconds
  // const uptime = Math.floor(client.uptime! / 1000);

  // if (uptime < 5) {
  //   const reply = new EmbedBuilder()
  //     .setTitle("Błąd")
  //     .setColor("#ff0000")
  //     .setDescription(
  //       "Obecnie bot jest w trakcie procesu uruchamiania.\n> Spróbuj ponownie później."
  //     )
  //     .setTimestamp();

  //   return interaction.reply({
  //     embeds: [reply],
  //   });
  // }

  const command = await client.commands.get(interaction.commandName);
  if (command) await command.run(client, interaction);

  logCommand(
    `Command \"${interaction.commandName}\" has been executed by ${
      (interaction.member as GuildMember).user.username
    }`
  );
};

const autoCompleteHandler = async (
  interaction: AutocompleteInteraction,
  client: Bot
) => {
  const interactionData = await client.interactions.get(
    `ac-${interaction.commandName}`
  );
  if (!interactionData) return;
  await interactionData.run(client, interaction);
};

const otherInteractionsHandler = (interaction: any, client: Bot) => {
  let customId = interaction.customId;
  let expectedUserId = interaction.member.id;

  if (customId.includes("-")) {
    expectedUserId = customId.split("-")[1];
    customId = customId.split("-")[0];
  }

  if (interaction.member.id !== expectedUserId) return;

  const interactionData = client.interactions.get(customId);
  if (!interactionData) return;
  interactionData.run(client, interaction);
};

export async function run(client: Bot, interaction: Interaction) {
  if (interaction.isCommand())
    return commandHandler(interaction as ChatInputCommandInteraction, client);
  if (interaction.isAutocomplete())
    return autoCompleteHandler(interaction as AutocompleteInteraction, client);

  otherInteractionsHandler(interaction, client);
}
