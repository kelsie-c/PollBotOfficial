import { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    SlashCommandBuilder, 
    PermissionFlagsBits 
} from 'discord.js';
import { getServerConfig, updateServerConfig, parseEmojis, parseColor } from './database.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ]
});

const isDevelopment = process.env.NODE_ENV !== 'production';

function createEditModal(pollData) {
    const modal = new ModalBuilder()
        .setCustomId('edit_poll_modal')
        .setTitle('Edit Poll Configuration');

    // Question input
    const questionInput = new TextInputBuilder()
        .setCustomId('question')
        .setLabel('Poll Question')
        .setStyle(TextInputStyle.Short)
        .setValue(pollData.question)
        .setMaxLength(200)
        .setRequired(true);

    // Options input
    const optionsText = pollData.options.join('\n');
    const optionsInput = new TextInputBuilder()
        .setCustomId('options')
        .setLabel('Poll Options (one per line)')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(optionsText)
        .setMaxLength(1000)
        .setRequired(true);

    // Emojis input with shorter placeholder to fit Discord's 100-char limit
    const emojisText = pollData.emojis.join(',');
    const emojisInput = new TextInputBuilder()
        .setCustomId('emojis')
        .setLabel('Custom Emojis (optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(emojisText)
        .setPlaceholder('🔥,💯,⭐,❤️,🎉,👍 (Win+. Mac:Cmd+Ctrl+Space)')
        .setMaxLength(4000) // Increased from 300 to Discord's actual limit
        .setRequired(false);

    // Channel input
    const channelInput = new TextInputBuilder()
        .setCustomId('channel')
        .setLabel('Channel (optional - leave blank for current)')
        .setStyle(TextInputStyle.Short)
        .setValue(pollData.channel)
        .setRequired(false);

    // Duration input
    const durationInput = new TextInputBuilder()
        .setCustomId('duration')
        .setLabel('Duration (e.g., 1h, 30m, 2d - leave blank for no end)')
        .setStyle(TextInputStyle.Short)
        .setValue(pollData.duration)
        .setRequired(false);

    const firstRow = new ActionRowBuilder().addComponents(questionInput);
    const secondRow = new ActionRowBuilder().addComponents(optionsInput);
    const thirdRow = new ActionRowBuilder().addComponents(emojisInput);
    const fourthRow = new ActionRowBuilder().addComponents(channelInput);
    const fifthRow = new ActionRowBuilder().addComponents(durationInput);

    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);
    return modal;
}

function createPollEmbed(question, options, color = '#00AE86') {
    const embed = new EmbedBuilder()
        .setTitle('📊 ' + question)
        .setColor(color)
        .setTimestamp();

    let description = '';
    options.forEach((option, index) => {
        const emojiIndex = index < 12 ? index : index % 12;
        const defaultEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🅰️', '🅱️'];
        const emoji = defaultEmojis[emojiIndex];
        description += `${emoji} ${option}\n`;
    });

    embed.setDescription(description);
    return embed;
}

function createPollEmbedWithCustomEmojis(question, options, emojis, color = '#00AE86') {
    const embed = new EmbedBuilder()
        .setTitle('📊 ' + question)
        .setColor(color)
        .setTimestamp();

    let description = '';
    options.forEach((option, index) => {
        const emoji = emojis[index] || emojis[index % emojis.length];
        description += `${emoji} ${option}\n`;
    });

    embed.setDescription(description);
    return embed;
}

async function addReactions(message, options, emojis) {
    for (let i = 0; i < options.length; i++) {
        try {
            const emoji = emojis[i] || emojis[i % emojis.length];
            await message.react(emoji);
        } catch (error) {
            console.error(`Failed to add reaction ${i}:`, error);
        }
    }
}

function parseDuration(durationStr) {
    if (!durationStr) return null;
    
    const regex = /(\d+)([smhd])/g;
    let totalMs = 0;
    let match;
    
    while ((match = regex.exec(durationStr.toLowerCase())) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
            case 's': totalMs += value * 1000; break;
            case 'm': totalMs += value * 60 * 1000; break;
            case 'h': totalMs += value * 60 * 60 * 1000; break;
            case 'd': totalMs += value * 24 * 60 * 60 * 1000; break;
        }
    }
    
    return totalMs > 0 ? totalMs : null;
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
}

// Store poll data temporarily for edit modal
const pollEditData = new Map();

client.once('ready', () => {
    console.log('Poll Bot is online!');
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
    console.log(`Connected to ${client.guilds.cache.size} server(s)`);
});

client.on('error', (error) => {
    console.error('Discord client error:', error);
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;
            const guildId = interaction.guild.id;

            if (commandName === 'poll') {
                const question = interaction.options.getString('question');
                const optionsStr = interaction.options.getString('options');
                const customEmojisStr = interaction.options.getString('emojis');
                const channelOption = interaction.options.getChannel('channel');
                const durationStr = interaction.options.getString('duration');

                const options = optionsStr.split('\n').map(opt => opt.trim()).filter(opt => opt.length > 0);
                
                if (options.length < 2) {
                    return interaction.reply({ 
                        content: '❌ Please provide at least 2 poll options!', 
                        ephemeral: true 
                    });
                }

                if (options.length > 20) {
                    return interaction.reply({ 
                        content: '❌ Maximum 20 poll options allowed!', 
                        ephemeral: true 
                    });
                }

                const serverConfig = getServerConfig(guildId);
                const targetChannel = channelOption || interaction.channel;
                
                let emojis;
                if (customEmojisStr) {
                    emojis = parseEmojis(customEmojisStr);
                } else {
                    emojis = parseEmojis(serverConfig?.default_emojis);
                }

                const color = serverConfig?.embed_color || '#00AE86';
                
                let embed;
                if (customEmojisStr || serverConfig?.default_emojis) {
                    embed = createPollEmbedWithCustomEmojis(question, options, emojis, color);
                } else {
                    embed = createPollEmbed(question, options, color);
                }

                const editButton = new ButtonBuilder()
                    .setCustomId('edit_poll')
                    .setLabel('Edit Poll')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('✏️');

                const actionRow = new ActionRowBuilder().addComponents(editButton);

                // Store poll data for potential editing
                const pollId = `${interaction.id}_${Date.now()}`;
                pollEditData.set(pollId, {
                    question,
                    options,
                    emojis,
                    channel: targetChannel.name,
                    duration: durationStr || ''
                });

                // Set the edit button to include poll ID
                editButton.setCustomId(`edit_poll_${pollId}`);

                const pollMessage = await targetChannel.send({ 
                    embeds: [embed],
                    components: [actionRow]
                });

                await addReactions(pollMessage, options, emojis);

                let replyContent = `✅ Poll created in ${targetChannel}!`;
                
                if (durationStr) {
                    const durationMs = parseDuration(durationStr);
                    if (durationMs) {
                        replyContent += `\n⏰ Duration: ${formatDuration(durationMs)}`;
                        
                        // Set timeout to end poll
                        setTimeout(async () => {
                            try {
                                const updatedMessage = await pollMessage.fetch();
                                const endedEmbed = EmbedBuilder.from(updatedMessage.embeds[0])
                                    .setTitle('📊 ' + question + ' (ENDED)')
                                    .setColor('#FF0000');
                                
                                await pollMessage.edit({ 
                                    embeds: [endedEmbed], 
                                    components: [] 
                                });
                            } catch (error) {
                                console.error('Error ending poll:', error);
                            }
                        }, durationMs);
                    }
                }

                await interaction.reply({ 
                    content: replyContent, 
                    ephemeral: true 
                });
            }

            else if (commandName === 'pollconfig') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                    return interaction.reply({ 
                        content: '❌ You need "Manage Server" permission to configure poll settings!', 
                        ephemeral: true 
                    });
                }

                const botName = interaction.options.getString('bot_name');
                const pollChannelId = interaction.options.getChannel('poll_channel')?.id;
                const embedColor = interaction.options.getString('embed_color');
                const defaultEmojis = interaction.options.getString('default_emojis');
                const pollRoleId = interaction.options.getRole('poll_role')?.id;

                const updates = {};
                if (botName) updates.botName = botName;
                if (pollChannelId) updates.pollChannelId = pollChannelId;
                if (embedColor) {
                    const parsedColor = parseColor(embedColor);
                    if (!parsedColor) {
                        return interaction.reply({ 
                            content: '❌ Invalid color format! Use hex (#FF0000) or CSS color names.', 
                            ephemeral: true 
                        });
                    }
                    updates.embedColor = parsedColor;
                }
                if (defaultEmojis) {
                    const parsedEmojis = parseEmojis(defaultEmojis);
                    if (parsedEmojis.length === 0) {
                        return interaction.reply({ 
                            content: '❌ Invalid emoji format! Separate emojis with commas.', 
                            ephemeral: true 
                        });
                    }
                    updates.defaultEmojis = defaultEmojis;
                }
                if (pollRoleId) updates.pollRoleId = pollRoleId;

                if (Object.keys(updates).length === 0) {
                    const config = getServerConfig(interaction.guild.id);
                    const embed = new EmbedBuilder()
                        .setTitle('📊 Current Poll Configuration')
                        .setColor(config?.embed_color || '#00AE86')
                        .addFields(
                            { name: 'Bot Name', value: config?.bot_name || 'Poll Bot', inline: true },
                            { name: 'Poll Channel', value: config?.poll_channel_id ? `<#${config.poll_channel_id}>` : 'Not set', inline: true },
                            { name: 'Embed Color', value: config?.embed_color || '#00AE86', inline: true },
                            { name: 'Default Emojis', value: config?.default_emojis || 'Standard (1️⃣2️⃣3️⃣...)', inline: true },
                            { name: 'Poll Role', value: config?.poll_role_id ? `<@&${config.poll_role_id}>` : 'Not set', inline: true }
                        );

                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                updateServerConfig(interaction.guild.id, updates);
                
                await interaction.reply({ 
                    content: '✅ Poll configuration updated successfully!', 
                    ephemeral: true 
                });
            }
        }

        else if (interaction.isButton()) {
            if (interaction.customId.startsWith('edit_poll_')) {
                const pollId = interaction.customId.replace('edit_poll_', '');
                const pollData = pollEditData.get(pollId);
                
                if (!pollData) {
                    return interaction.reply({ 
                        content: '❌ Poll data not found. This poll may be too old to edit.', 
                        ephemeral: true 
                    });
                }

                const modal = createEditModal(pollData);
                
                // Store association between modal and poll
                pollEditData.set(interaction.user.id, { ...pollData, pollId, messageId: interaction.message.id });
                
                await interaction.showModal(modal);
            }
        }

        else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'edit_poll_modal') {
                const pollData = pollEditData.get(interaction.user.id);
                
                if (!pollData) {
                    return interaction.reply({ 
                        content: '❌ Poll data not found. Please try again.', 
                        ephemeral: true 
                    });
                }

                const question = interaction.fields.getTextInputValue('question');
                const optionsStr = interaction.fields.getTextInputValue('options');
                const customEmojisStr = interaction.fields.getTextInputValue('emojis');
                const channelName = interaction.fields.getTextInputValue('channel');
                const durationStr = interaction.fields.getTextInputValue('duration');

                const options = optionsStr.split('\n').map(opt => opt.trim()).filter(opt => opt.length > 0);
                
                if (options.length < 2) {
                    return interaction.reply({ 
                        content: '❌ Please provide at least 2 poll options!', 
                        ephemeral: true 
                    });
                }

                if (options.length > 20) {
                    return interaction.reply({ 
                        content: '❌ Maximum 20 poll options allowed!', 
                        ephemeral: true 
                    });
                }

                const serverConfig = getServerConfig(interaction.guild.id);
                
                let emojis;
                if (customEmojisStr) {
                    emojis = parseEmojis(customEmojisStr);
                } else {
                    emojis = parseEmojis(serverConfig?.default_emojis);
                }

                const color = serverConfig?.embed_color || '#00AE86';
                
                let embed;
                if (customEmojisStr || serverConfig?.default_emojis) {
                    embed = createPollEmbedWithCustomEmojis(question, options, emojis, color);
                } else {
                    embed = createPollEmbed(question, options, color);
                }

                // Create new edit button with updated poll data
                const editButton = new ButtonBuilder()
                    .setCustomId(`edit_poll_${pollData.pollId}`)
                    .setLabel('Edit Poll')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('✏️');

                const actionRow = new ActionRowBuilder().addComponents(editButton);

                // Update stored poll data
                pollEditData.set(pollData.pollId, {
                    question,
                    options,
                    emojis,
                    channel: channelName || pollData.channel,
                    duration: durationStr
                });

                try {
                    await interaction.message.edit({ 
                        embeds: [embed],
                        components: [actionRow]
                    });

                    // Clear old reactions and add new ones
                    await interaction.message.reactions.removeAll();
                    await addReactions(interaction.message, options, emojis);

                    await interaction.reply({ 
                        content: '✅ Poll updated successfully!', 
                        ephemeral: true 
                    });

                    // Clean up user's poll data
                    pollEditData.delete(interaction.user.id);

                } catch (error) {
                    console.error('Error updating poll:', error);
                    await interaction.reply({ 
                        content: '❌ Failed to update poll. Please try again.', 
                        ephemeral: true 
                    });
                }
            }
        }

    } catch (error) {
        console.error('Error handling interaction:', error);
        try {
            const errorMessage = '❌ An error occurred while processing your request. Please try again.';
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        } catch (followUpError) {
            console.error('Error sending error message:', followUpError);
        }
    }
});

// Slash command definitions
const commands = [
    new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll with custom options')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true)
                .setMaxLength(200))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Poll options (separate with new lines)')
                .setRequired(true)
                .setMaxLength(1000))
        .addStringOption(option =>
            option.setName('emojis')
                .setDescription('Custom emojis (separate with commas, e.g., 🔥,💯,⭐)')
                .setRequired(false)
                .setMaxLength(2000)) // Increased maxLength significantly
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to post the poll (default: current channel)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Poll duration (e.g., 1h, 30m, 2d)')
                .setRequired(false)),
                
    new SlashCommandBuilder()
        .setName('pollconfig')
        .setDescription('Configure poll bot settings for this server')
        .addStringOption(option =>
            option.setName('bot_name')
                .setDescription('Custom bot name for embeds')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('poll_channel')
                .setDescription('Default channel for polls')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('embed_color')
                .setDescription('Default embed color (hex or CSS color name)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('default_emojis')
                .setDescription('Default emojis for polls (comma-separated)')
                .setRequired(false)
                .setMaxLength(2000)) // Increased maxLength significantly
        .addRoleOption(option =>
            option.setName('poll_role')
                .setDescription('Role that can create polls')
                .setRequired(false))
];

// Register commands
async function deployCommands() {
    try {
        console.log('Started refreshing application (/) commands.');
        
        if (isDevelopment) {
            // Register commands for development guild only
            const guild = client.guilds.cache.first();
            if (guild) {
                await guild.commands.set(commands);
                console.log(`Successfully registered commands for development guild: ${guild.name}`);
            }
        } else {
            // Register commands globally for production
            await client.application.commands.set(commands);
            console.log('Successfully registered global commands.');
        }
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

client.once('ready', deployCommands);

const token = isDevelopment ? process.env.DEV_DISCORD_TOKEN : process.env.DISCORD_TOKEN;
client.login(token);