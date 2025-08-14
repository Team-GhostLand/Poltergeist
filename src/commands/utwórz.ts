import {
    ChatInputCommandInteraction,
    Collection,
    PermissionsBitField,
    SlashCommandBuilder,
    TextChannel
} from "discord.js";

import Bot from "../classes/Bot.js";
import Strings from "../strings.json" with { type: "json" };

export const data = { ...new SlashCommandBuilder()
    .setName("utwórz")
    .setDescription(Strings.create_description)
    .setDefaultMemberPermissions(PermissionsBitField.Flags.UseApplicationCommands)
    .setDMPermission(false)
    .addStringOption((option) => option
        .setName("nick")
        .setDescription(Strings.create_field_description_nick)
        .setRequired(true)
    )
    .addStringOption((option) => option
        .setName("uuid")
        .setDescription(Strings.create_field_description_uuid)
        .setRequired(false)
    )
    .toJSON(),
};

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({
        ephemeral: true,
    });

    // Get channel to send the panel to
    const channel = interaction.options.getChannel("kanał", true) as TextChannel;
    // Get link to plan
    const link = interaction.options.getString("link", true);

    const output = new Collection; //await pdf2img.convert(link);
    output.forEach(async (img: any, key) => {
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