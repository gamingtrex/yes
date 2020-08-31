const { Client, Util, MessageEmbed } = require("discord.js");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
require("dotenv").config();
require("./server.js");

const bot = new Client({
    disableMentions: "all"
});

const PREFIX = process.env.PREFIX;
const youtube = new YouTube(process.env.YTAPI_KEY);
const queue = new Map();

bot.on('ready', () => {
    console.log(":>!");
    //bot.user.setActivity(`Prefix is`${prefix})
        bot.user.setActivity(`Never Gonna Give You Up | pp#help`,  { type: `LISTENING` });
});

bot.on("warn", console.warn);
bot.on("error", console.error);
bot.on("ready", () => console.log(`[READY] ${bot.user.tag} has been successfully booted up!`));
bot.on("shardDisconnect", (event, id) => console.log(`[SHARD] Shard ${id} disconnected (${event.code}) ${event}, trying to reconnect...`));
bot.on("shardReconnecting", (id) => console.log(`[SHARD] Shard ${id} reconnecting...`));

bot.on("message", async (message) => { // eslint-disable-line
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.split(" ");
    const searchString = args.slice(1).join(" ");
    const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";
    const serverQueue = queue.get(message.guild.id);

    let command = message.content.toLowerCase().split(" ")[0];
    command = command.slice(PREFIX.length);
    if (command === "reee") {
        message.channel.send("https://www.youtube.com/watch?v=qTksCYUgI7s&t=8s");
    }
    if (command === "help" || command == "cmd") {
        const helpembed = new MessageEmbed()
            .setColor("#9400D3")
            .setAuthor(bot.user.tag, bot.user.displayAvatarURL())
            .setDescription(`
__**Command list**__
> \`play\` > **\`play [title/url]\`**
> \`search\` > **\`search [title]\`**
> \`skip\`, \`stop\`,  \`pause\`, \`resume\`
> \`nowplaying\`, \`queue\`, \`volume\`, \`loop\``)
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }));
        message.channel.send(helpembed);
    }
    if (command === "play" || command === "p") {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send("get in vc first, smol pp");
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) {
            return message.channel.send("i need the CONNECT permission u dumbass");
        }
        if (!permissions.has("SPEAK")) {
            return message.channel.send("give the SPEAK permission first lol");
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return message.channel.send(`<:yes:591629527571234819>  **|**  Playlist: **\`${playlist.title}\`** has been added to the queue :>`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    var video = await youtube.getVideoByID(videos[0].id);
                    if (!video) return message.channel.send("🆘  **|**  I didnt find anything ;-;");
                } catch (err) {
                    console.error(err);
                    return message.channel.send("🆘  **|**  I didnt find anything ;-;");
                }
            }
            return handleVideo(video, message, voiceChannel);
        }
    }
    if (command === "search" || command === "sc") {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send("get in a vc idiot sandwich");
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) {
            return message.channel.send("i need the CONNECT permission u dumbass");
        }
        if (!permissions.has("SPEAK")) {
            return message.channel.send("give the SPEAK permission first lol");
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return message.channel.send(`<:yes:591629527571234819>  **|**  Playlist: **\`${playlist.title}\`** has been added to the queue uwu`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    let embedPlay = new MessageEmbed()
                        .setColor("#9400D3")
                        .setAuthor("Search results", message.author.displayAvatarURL())
                        .setDescription(`${videos.map(video2 => `**\`${++index}\`  |**  ${video2.title}`).join("\n")}`)
                        .setFooter("choose one of the following 10 results, this message will auto-deleted in 15 seconds... bich");
                    // eslint-disable-next-line max-depth
                    message.channel.send(embedPlay).then(m => m.delete({
                        timeout: 15000
                    }))
                    try {
                        var response = await message.channel.awaitMessages(message2 => message2.content > 0 && message2.content < 11, {
                            max: 1,
                            time: 15000,
                            errors: ["time"]
                        });
                    } catch (err) {
                        console.error(err);
                        return message.channel.send("Time expired lol");
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return message.channel.send("🆘  **|**  I didnt find anything ;-;");
                }
            }
            response.delete();
            return handleVideo(video, message, voiceChannel);
        }

    } else if (command === "skip") {
        if (!message.member.voice.channel) return message.channel.send("get in a vc first ya dingus");
        if (!serverQueue) return message.channel.send("nothin in the channel lol");
        serverQueue.connection.dispatcher.end("[runCmd] Skip command has been used");
        return message.channel.send("⏭️  **|**  skipped uwu");

    } else if (command === "stop") {
        if (!message.member.voice.channel) return message.channel.send("get in a fckin vc lol");
        if (!serverQueue) return message.channel.send("nothin is playing");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end("[runCmd] Stop command has been used");
        return message.channel.send("⏹️  **|**  stopped :>");

    } else if (command === "volume" || command === "vol") {
        if (!message.member.voice.channel) return message.channel.send("get in vc pls");
        if (!serverQueue) return message.channel.send("nothin is playing");
        if (!args[1]) return message.channel.send(`The volume is: **\`${serverQueue.volume}%\`**`);
        if (isNaN(args[1]) || args[1] > 100) return message.channel.send("set it from **\`1\`** - **\`100\`**");
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolume(args[1] / 100);
        return message.channel.send(`done, volume is now: **\`${args[1]}%\`**`);

    } else if (command === "nowplaying" || command === "np") {
        if (!serverQueue) return message.channel.send("nothing playing uwu");
        return message.channel.send(`🎶  **|**  :> Playing: **\`${serverQueue.songs[0].title}\`**`);

    } else if (command === "queue" || command === "q") {
        if (!serverQueue) return message.channel.send("nope");
        let embedQueue = new MessageEmbed()
            .setColor("#9400D3")
            .setAuthor("Song queue", message.author.displayAvatarURL())
            .setDescription(`${serverQueue.songs.map(song => `**-** ${song.title}`).join("\n")}`)
            .setFooter(`• Now Playing: ${serverQueue.songs[0].title}`);
        return message.channel.send(embedQueue);

    } else if (command === "pause") {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return message.channel.send("⏸  **|**  Paused :>");
        }
        return message.channel.send("nope");

    } else if (command === "resume") {
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return message.channel.send("▶  **|**  Resumed hehe");
        }
        return message.channel.send("nope :>");
    } else if (command === "loop") {
        if (serverQueue) {
            serverQueue.loop = !serverQueue.loop;
            return message.channel.send(`🔁  **|**  Loop **\`${serverQueue.loop === true ? "enabled" : "disabled"}\`**`);
        };
        return message.channel.send("nope");
    }
});

async function handleVideo(video, message, voiceChannel, playlist = false) {
    const serverQueue = queue.get(message.guild.id);
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 100,
            playing: true,
            loop: false
        };
        queue.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`[ERROR] I could not join the voice channel, because: ${error} ;-;`);
            queue.delete(message.guild.id);
            return message.channel.send(`I could not join the voice channel, because: **\`${error}\`** ;-;`);
        }
    } else {
        serverQueue.songs.push(song);
        if (playlist) return;
        else return message.channel.send(`<:yes:591629527571234819>  **|**  **\`${song.title}\`** has been added to the queue uwu`);
    }
    return;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        return queue.delete(guild.id);
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url))
        .on("finish", () => {
            const shiffed = serverQueue.songs.shift();
            if (serverQueue.loop === true) {
                serverQueue.songs.push(shiffed);
            };
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolume(serverQueue.volume / 100);

    serverQueue.textChannel.send({
        embed: {
            color: "BLUE",
            description: `🎶  **|**  Play: **\`${song.title}\`**`
        }
    });
}

bot.login(process.env.BOT_TOKEN);