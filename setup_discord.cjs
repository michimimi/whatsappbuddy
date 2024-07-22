const { Client, GatewayIntentBits, ChannelType, EmbedBuilder } = require('discord.js');
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

const { DISCORD_BOT_TOKEN, embedMessageId, embedInfo } = config;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
    console.log('Bot is ready!');

    // Get the first guild (server) the bot is in
    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error('No guild found.');
        process.exit(1);
    }
    config.GUILD_ID = guild.id;

    // Remove all existing channels
    const channels = guild.channels.cache;
    for (const channel of channels.values()) {
        try {
            await channel.delete();
            console.log(`Deleted channel ${channel.name}`);
        } catch (error) {
            console.error(`Failed to delete channel ${channel.name}:`, error);
        }
    }

    // Create the information channel
    let infoChannel = await guild.channels.create({
        name: 'information',
        type: ChannelType.GuildText
    });
    config.INFO_CHANNEL_ID = infoChannel.id;

    // Create the category
    let category = await guild.channels.create({
        name: 'WHATSAPP MESSAGES',
        type: ChannelType.GuildCategory
    });
    config.CATEGORY_ID = category.id;

    // Save updated config
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');

    // Create the embed
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

    // Post or update the embed message
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

    console.log('Setup complete.');
    process.exit(0);
});

client.login(DISCORD_BOT_TOKEN).catch(err => {
    console.error('Error logging in:', err);
    process.exit(1);
});