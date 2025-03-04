import {
  ChannelType,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";

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

//Variablen

const categoryID = "1345887600489267202";
const botTestChannelId = "1346245584226357258";
let msgCache;

client.on(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);

  msgCache = await fetchMessagesFromCategory(client, categoryID);
  console.log(msgCache);
});

client.on(Events.MessageCreate, async (message) => {
  if (
    message.channel.id === botTestChannelId &&
    message.content.startsWith("!test")
  ) {
    await message.channel.send("!test call");
  }
  if (message.author.bot) return;

  if (message.channel.parentId === categoryID) {
    let hit = searchMessages(message.content);

    if (hit !== false) {
      message.delete();
      message.author.send(
        "Dein Anime Vorschlag wurde gelöscht weil er schon in " +
          hit.channel +
          " gepostet wurde"
      );
    } else {
      console.log("push Message");
      msgCache[message.channel.name].push({
        id: message.id,
        content: message.content,
        author: {
          id: message.author.id,
          username: message.author.username,
          tag: message.author.tag,
        },
        timestamp: message.createdTimestamp,
        attachments: [...message.attachments.values()],
        embeds: message.embeds,
      });
    }
  } else {
    console.log("outside of scope");
  }
});

client.login(process.env.TOKEN);

async function fetchMessagesFromCategory(client, categoryId) {
  try {
    // Get the category from the client's cache
    const category = client.channels.cache.get(categoryId);

    if (!category || category.type !== ChannelType.GuildCategory) {
      throw new Error("Invalid category ID or category not found");
    }

    // Get all text channels in the category
    const textChannels = category.children.cache.filter(
      (channel) => channel.type === ChannelType.GuildText
    );

    if (textChannels.size === 0) {
      console.log("No text channels found in this category");
      return {};
    }

    // Object to store messages from each channel
    const allMessages = {};

    // Fetch messages from each channel
    for (const [channelId, channel] of textChannels) {
      try {
        console.log(`Fetching messages from #${channel.name}...`);

        // Fetch the last 200 messages (in two batches of 100)
        const firstBatch = await channel.messages.fetch({ limit: 100 });

        // If there are more messages, fetch another 100
        let secondBatch = new Collection();
        if (firstBatch.size === 100) {
          const lastMessageId = firstBatch.last().id;
          secondBatch = await channel.messages.fetch({
            limit: 100,
            before: lastMessageId,
          });
        }

        // Combine both batches and convert to array
        const combinedMessages = [
          ...firstBatch.map((msg) => ({
            id: msg.id,
            content: msg.content,
            author: {
              id: msg.author.id,
              username: msg.author.username,
              tag: msg.author.tag,
            },
            timestamp: msg.createdTimestamp,
            attachments: [...msg.attachments.values()],
            embeds: msg.embeds,
          })),
          ...secondBatch.map((msg) => ({
            id: msg.id,
            content: msg.content,
            author: {
              id: msg.author.id,
              username: msg.author.username,
              tag: msg.author.tag,
            },
            timestamp: msg.createdTimestamp,
            attachments: [...msg.attachments.values()],
            embeds: msg.embeds,
          })),
        ];

        // Store in the result object
        allMessages[channel.name] = combinedMessages;

        console.log(
          `Fetched ${combinedMessages.length} messages from #${channel.name}`
        );
      } catch (error) {
        console.error(
          `Error fetching messages from #${channel.name}:`,
          error.message
        );
      }
    }

    return allMessages;
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    throw error;
  }
}

function findCategoryByName(guild, categoryName) {
  // Ensure the guild and categoryName are valid
  if (!guild || !categoryName) {
    throw new Error("Guild and category name must be provided.");
  }

  // Search for the category in the guild's channels
  const category = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name.toLowerCase() === categoryName.toLowerCase()
  );

  // Return the category if found, otherwise null
  return category || null;
}

/**
 * Searches all cached messages for an exact match of a string (case insensitive)
 * @param {string} searchString - The string to search for
 * @param {Object} options - Search options
 * @param {boolean} options.wholeWord - Whether to match whole words only (default: false)
 * @param {boolean} options.includeDetails - Whether to include channel and message details (default: true)
 * @returns {}  - Array of matching message objects with context information
 */
function searchMessages(searchString) {
  // Normalize the search string to lowercase for case-insensitive comparison
  const normalizedSearchString = searchString.toLowerCase();

  for (const channelName in msgCache) {
    const channelMessages = msgCache[channelName];

    // Iterate through each message in the channel
    for (const message of channelMessages) {
      // Skip messages with no content
      if (!message.content) continue;

      let isMatch = false;
      // Use simple includes for substring matching (case insensitive)
      isMatch = message.content.toLowerCase() == normalizedSearchString;

      if (isMatch) {
        return { channel: channelName, msg: message };
      }
    }
  }

  return false;
}
