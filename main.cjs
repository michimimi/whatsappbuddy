const { Client: WhatsAppClient, LocalAuth } = require('whatsapp-web.js');
const { Client: DiscordClient, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

// Load configuration from config.json
let config;
try {
    const configData = fs.readFileSync('config.json', 'utf8');
    config = JSON.parse(configData);
} catch (error) {
    console.error('Error reading config.json:', error);
    process.exit(1); // Exit the process with an error code
}

const { DISCORD_BOT_TOKEN, GUILD_ID, CATEGORY_ID, INFO_CHANNEL_ID, embedMessageId, embedInfo, channelMapping, channelNames } = config;

const discordClient = new DiscordClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const whatsappClient = new WhatsAppClient({
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
    authStrategy: new LocalAuth()
});

// Function to save channel names to JSON file
function saveChannelNames() {
    fs.writeFileSync('config.json', JSON.stringify({ ...config, channelNames: channelNames }, null, 2), 'utf8');
}

// Function to create a valid Discord channel name from the WhatsApp chat ID
function createValidChannelName(chatId) {
    return chatId.replace(/[@.]/g, '-');
}

discordClient.login(DISCORD_BOT_TOKEN);

discordClient.on('ready', async () => {
    console.log('Discord bot is ready!');
    
    const guild = discordClient.guilds.cache.get(GUILD_ID);

    const infoChannel = guild.channels.cache.get(INFO_CHANNEL_ID);
    if (infoChannel) {
        const exampleEmbed = new EmbedBuilder()
            .setColor(embedInfo.color)
            .setTitle(embedInfo.title)
            .setAuthor(embedInfo.author)
            .setThumbnail(embedInfo.thumbnail)
            .setDescription(embedInfo.description)
            .addFields(embedInfo.fields)
            .setImage(embedInfo.image);

        if (embedInfo.timestamp) {
            exampleEmbed.setTimestamp();
        }

        if (embedMessageId) {
            try {
                const message = await infoChannel.messages.fetch(embedMessageId);
                if (message) {
                    await message.edit({ embeds: [exampleEmbed] });
                } else {
                    const newMessage = await infoChannel.send({ embeds: [exampleEmbed] });
                    config.embedMessageId = newMessage.id;
                    fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
                }
            } catch (error) {
                console.error('Error fetching or editing the embed message:', error);
                const newMessage = await infoChannel.send({ embeds: [exampleEmbed] });
                config.embedMessageId = newMessage.id;
                fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
            }
        } else {
            const newMessage = await infoChannel.send({ embeds: [exampleEmbed] });
            config.embedMessageId = newMessage.id;
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
        }
    } else {
        console.error(`Info channel with ID ${INFO_CHANNEL_ID} not found.`);
    }

    whatsappClient.on('message_create', async message => {
        await handleMessageCreate(message);
    });

    discordClient.on('messageCreate', async discordMessage => {
        if (discordMessage.author.bot) return; // Ignore bot messages

        if (discordMessage.content.startsWith('!rename ')) {
            await handleRenameCommand(discordMessage);
            return;
        }

        const channelName = discordMessage.channel.name;
        const chatId = channelMapping[channelName]; // Retrieve the chat ID from the mapping
        console.log(`Decoded chatId: ${chatId}`); // Log the decoded chatId

        if (!chatId) {
            console.error(`No mapping found for channel: ${channelName}`);
            return;
        }

        try {
            const chat = await whatsappClient.getChatById(chatId);
            if (chat) {
                console.log(`Sending message to WhatsApp chat: ${chatId}`); // Log the chatId
                await chat.sendMessage(discordMessage.content); // Use the chat object to send a message
            } else {
                console.error(`WhatsApp chat with ID ${chatId} not found.`);
            }
        } catch (error) {
            console.error(`Error sending message to WhatsApp chat ${chatId}:`, error);
        }
    });
});

whatsappClient.initialize();

whatsappClient.on('qr', qr => {
    console.log('QR Code received', qr);
});

// Function to handle WhatsApp messages
async function handleMessageCreate(message) {
    try {
        const chatId = message.from; // Use the chat ID directly
        const channelName = createValidChannelName(chatId); // Create a valid channel name
        console.log(`Encoded channelName: ${channelName}`); // Log the encoded channel name

        const guild = discordClient.guilds.cache.get(GUILD_ID);
        let channel = guild.channels.cache.find(channel => channel.name === channelName);

        if (message.fromMe) {
            if (channel) {
                // Post the message in the existing channel
                channel.send(`You sent: ${message.body}`);
            } else {
                console.log('Message is from me but no existing channel found.');
            }
            return; // Do not create a new channel if the message is from the current user
        }

        if (!channel) {
            // Create a new channel under the specified category if it doesn't exist
            channel = await guild.channels.create({
                name: channelName,
                type: 0, // 0 is for a text channel
                parent: CATEGORY_ID // Specify the category ID
            });

            // Notify the user and ask for the custom name
            const botMessage = await channel.send(`A new channel has been created for WhatsApp chat ${chatId}. What do you want to name this channel?`);
            await botMessage.pin();

            const filter = response => response.author.id !== discordClient.user.id;
            const collector = channel.createMessageCollector({ filter, max: 1, time: 60000 }); // Wait for 1 minute

            collector.on('collect', response => {
                const customName = response.content;
                channelNames[channelName] = customName;
                saveChannelNames();
                channel.setName(customName);
                botMessage.unpin();
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    botMessage.unpin();
                    channel.send('No name was provided within the time limit.');
                }
            });
        }

        // Update the channel mapping
        channelMapping[channelName] = chatId;
        fs.writeFileSync('config.json', JSON.stringify({ ...config, channelMapping: channelMapping }, null, 2), 'utf8');

        // Post the message in the corresponding channel
        channel.send(`You received: ${message.body}\n\nFrom: ${chatId}`);
    } catch (error) {
        console.error('Error handling WhatsApp message:', error);
    }
}

// Function to handle rename command
async function handleRenameCommand(discordMessage) {
    const args = discordMessage.content.split(' ');
    if (args.length < 2) {
        discordMessage.reply('Please provide a new name for the channel.');
        return;
    }

    const newName = args.slice(1).join(' ');
    const channel = discordMessage.channel;
    const currentChannelName = channel.name;

    if (!channelMapping[currentChannelName]) {
        discordMessage.reply('This channel is not mapped to a WhatsApp chat.');
        return;
    }

    channel.setName(newName).then(updatedChannel => {
        channelNames[updatedChannel.name] = newName;
        saveChannelNames();
        discordMessage.reply(`Channel name has been updated to ${newName}`);
    }).catch(error => {
        console.error('Error updating channel name:', error);
        discordMessage.reply('There was an error updating the channel name.');
    });
}
