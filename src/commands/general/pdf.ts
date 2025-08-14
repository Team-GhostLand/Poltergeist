import {
    ChannelType,
    ChatInputCommandInteraction,
    PermissionsBitField,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";

import pdf2img from "pdf-img-convert";
import Bot from "../../classes/Bot.js";

export const data = {
    ...new SlashCommandBuilder()
        .setName("pdf")
        .setDescription("Wysyła PDF w formie obrazka/ów na wybrany kanał")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false)
        .addChannelOption((option) =>
            option
                .setName("kanał")
                .setDescription("Kanał na który ma zostać wysłany PDF")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((option) =>
            option
                .setName("link")
                .setDescription("Link do planu lekcji")
                .setRequired(true)
        )
        .toJSON(),
};

export async function run(
    client: Bot,
    interaction: ChatInputCommandInteraction
) {
    await interaction.deferReply({
        ephemeral: true,
    });

    // Get channel to send the panel to
    const channel = interaction.options.getChannel("kanał", true) as TextChannel;
    // Get link to plan
    const link = interaction.options.getString("link", true);

    const output = await pdf2img.convert(link);
    output.forEach(async (img, key) => {
        await channel.send({
            // @ts-ignore
            files: [
                {
                    name: `plan-${key}.png`,
                    attachment: Buffer.from(img),
                },
            ],
        });
    });

    // Send success message
    await interaction.editReply({
        content: `Wysłano **[wybrany PDF](${link})** na <#${channel.id}>!`,
    });
}