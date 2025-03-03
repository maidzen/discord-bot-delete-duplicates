import { Client, Events, GatewayIntentBits, Partials } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});
client.on(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (await checkMessagesForString(message.channelId, message.content)) {
    await message.channel.send("Duplicate found - Deleting msg");
    await message.delete();
  } else {
    await message.channel.send("Valid url");
  }
});

client.login(process.env.TOKEN);

async function checkMessagesForString(orginalMsg, searchString) {
  try {
    const channel = await client.channels.fetch(orginalMsg.channelId);

    if (!channel || !channel.isTextBased()) {
      console.error("Invalid channel or not a text-based channel.");
      return;
    }

    let found = false;
    let lastMessageId = orginalMsg.id;

    // Fetch messages in batches of 100 (Discord's limit)
    while (!found) {
      const options = { limit: 100 };
      if (lastMessageId) {
        options.before = lastMessageId;
      }

      const messages = await channel.messages.fetch(options);

      if (messages.size === 0) {
        break; // No more messages to fetch
      }

      for (const message of messages.values()) {
        if (orginalMsg.id == message.id) {
          continue;
        }
        if (message.content.includes(searchString)) {
          console.log(
            `Found the string in message ID: ${message.id}, Content: "${message.content}"`
          );
          found = true;
          break;
        }
      }

      // Update the last message ID for the next batch
      lastMessageId = messages.last().id;
    }

    return found;
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}
