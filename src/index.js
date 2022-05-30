import { Client, Intents, MessageEmbed } from "discord.js";
import { config } from "dotenv";

import { Data } from "../config.js";
import { listToMatrix } from "./utils/listToMatrix.js";

const __warns = [];

const client = new Client({
	allowedMentions: { parse: [], repliedUser: false },
	intents: new Intents().add([
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MEMBERS,
	]),
});

// Prevent crashes upon 'error'
client.on("error", console.error);
client.on("warn", console.warn);
process.on("unhandledRejection", console.error);

client.on("ready", () => {
	console.log(`Successfully logged in as ${client.user.tag} (${client.user.id})`);

	// Set a status
	client.user.presence.set({
		activities: [{
			name: "Logging images for you!",
		}],
		status: "dnd",
	});
});

client.on("messageDelete", async message => {
	const images = [...message.attachments.values()]
		.filter((attachment) => attachment.contentType.startsWith("image"))
		.map((attachment, index) => {
			attachment.index = index;
			return attachment;
		});

	let embeds = [];
	for (const image of images) {
		embeds.push(
			new MessageEmbed()
				.setColor("#da0000")
				.setAuthor({ name: `${message.author.tag} (${message.author.id})`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
				.setDescription(`Image ${image.index + 1} of ${images.length} sent in ${message.channel}.`)
				.setImage(image.url)
				.setFooter({ text: `Message ID: ${message.id}` })
				.setTimestamp(),
		);
	}

	embeds = listToMatrix(embeds, 10);

	for (const messageEmbeds of embeds) {
		const channel = Data.logChannels[message.guild.id];

		if (!channel) {
			if (!__warns.includes(message.guild.id)) {
				console.warn(
					`Received messageDelete event in guild "${message.guild.name}", but no log channel was found.
Add a property named '${message.guild.id}' in logChannels in config.js with the corresponding ID of the channel where you would like image delete logs to be sent.
This warning will not appear for the "${message.guild.name}" guild once again for the duration of this programme.`,
				);
			}
			__warns.push(message.guild.id);
			break;
		}
		else {
			client.channels.cache.get(channel).send({ embeds: messageEmbeds });
		}
	}
});

config();
client.login(process.env.token);