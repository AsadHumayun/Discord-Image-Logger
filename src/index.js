import {
	Events,
	Client,
	GatewayIntentBits,
	EmbedBuilder,
} from "discord.js";
import { config } from "dotenv";

import { Data } from "../config.js";
import { listToMatrix } from "./utils/listToMatrix.js";

config();
const __warns = [];

const client = new Client({
	allowedMentions: { parse: [], repliedUser: false },
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
	],
});

// Prevent crashes upon 'error'
client.on("error", console.error);
client.on("warn", console.warn);
process.on("unhandledRejection", console.error);

client.on(Events.ClientReady, () => {
	console.log(`Successfully logged in as ${client.user.tag} (${client.user.id})`);

	// Set a status
	client.user.presence.set({
		activities: [{
			name: "Logging images for you!",
		}],
		status: "dnd",
	});
});

client.on(Events.MessageDelete, async message => {
	const images = [...message.attachments.values()]
		.filter((attachment) => attachment.contentType.startsWith("image"))
		.map((attachment, index) => {
			attachment.index = index;
			return attachment;
		});

	let embeds = [];
	for (const image of images) {
		/* This is the embed that will display each deleted image */
		embeds.push(
			new EmbedBuilder()
				.setColor("#da0000")
				.setAuthor({ name: `${message.author.tag} (${message.author.id})`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
				.setDescription(`Image ${image.index + 1} of ${images.length} sent in ${message.channel}.\n\n[Jump to Message](${message.url}) • [CDN URL](${image.url}) • [Proxy URL](${image.proxyURL})`)
				.setImage(image.url)
				.setFooter({ text: `Message ID: ${message.id}` })
				.setTimestamp(),
		);
	}

	embeds = listToMatrix(embeds, 10);

	for (const messageEmbeds of embeds) {
		const channel = Data.logChannels[message.guild.id];

		if (channel) {
			client.channels.cache.get(channel).send({ embeds: messageEmbeds });
		}
		else {
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
	}
});

client.login(process.env.token);
