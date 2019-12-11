const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const prettyMilliseconds = require('pretty-ms');
const approx = require('approximate-number');
const ytSearch = require('yt-search');
const validUrl = require('valid-url');
const cooldown = new Set();
const {
	prefix,
	token,
} = require('./config.json');
const Streaming = require("discord-streaming");
const client = new Discord.Client();
const queue = new Map();
client.on("ready", () => {
  console.log("\n");
  console.log(
    "           ████████████████████████████████████████████████████████████████████████████████████████████████"
  );
  console.log(
    "              ██                                                                                        ██"
  );
  console.log(
    "              ██       ██████╗       ██████╗ ██████╗  ██████╗ ████████╗███████╗ ██████╗████████╗        ██ "
  );
  console.log(
    "              ██       ██╔════╝       ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝       ██ "
  );
  console.log(
    "              ██       ██║  ███╗█████╗██████╔╝██████╔╝██║   ██║   ██║   █████╗  ██║        ██║          ██ "
  );
  console.log(
    "              ██       ██║   ██║╚════╝██╔═══╝ ██╔══██╗██║   ██║   ██║   ██╔══╝  ██║        ██║          ██ "
  );
  console.log(
    "              ██       ╚██████╔╝      ██║     ██║  ██║╚██████╔╝   ██║   ███████╗╚██████╗   ██║          ██ "
  );
  console.log(
    "              ██       ╚═════╝       ╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚══════╝ ╚═════╝   ╚═╝           ██ "
  );
  console.log(
    "              ██                                                                                        ██"
  );
  console.log(
    "           ████████████████████████████████████████████████████████████████████████████████████████████████"
  );
  console.log("\n");

  console.log(` > Bot connected to => ${client.user.tag}!`);
  let streamed = prefix + "help";
  let rotate = 0;
  setInterval(function() {
    if (rotate === 0) {
      client.user.setActivity(
        ` ${streamed} |` + ` ${client.guilds.size} servers ☢️`,
        { type: "WATCHING" }
      );
      rotate = 1;
    } else if (rotate === 1) {
      client.user.setActivity(
        ` ${streamed} |` + ` ${client.users.size} users 🌌`,
        { type: "WATCHING" }
      );
      rotate = 2;
    } else if (rotate === 2) {
      client.user.setActivity(
        ` ${streamed} |` + ` ${client.channels.size} channels 🌀`,
        { type: "WATCHING" }
      );
      rotate = 0;
    }
  }, 10 * 1500);
});

client.on('message', async message => {
	if (cooldown.has(message.author.id)) {
		return;
	}
	cooldown.add(message.author.id);
	setTimeout(function() {
		cooldown.delete(message.author.id);
	}, 3000);
	if (message.guild == undefined) return;
	if (message.channel.type === "dm") return;
	if (client.user.id == message.author.id) return;
	if (message.author.id === "639933222225969152") return;
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;
	const serverQueue = queue.get(message.guild.id);
	if (message.content.startsWith(`${prefix}play`)) {
		if(message.deletable) message.delete();
		let args = message.cleanContent.split(" ").slice(1);
		let sueur = args.slice(0).join(" ");
		if (validUrl.isUri(sueur)){
			if (!sueur.startsWith('https://www.youtube.com')) return message.reply("Le lien que tu a envoyer n'est pas valide ! ``` nepplay {URL youtube} ``` ou alors ``` nepplay {Le nom de la musique/Video ```");
        	start(message, serverQueue);
	    } else {
	    	ytSearch(sueur, function(err, r) {
					if(err) return console.log(err);
					// message.reply(r);
			 		startsearch(message, r.videos[0].videoId, serverQueue);
				});
	    }
		message.reply(" Chargement de la musique...");
		return;
	} else if (message.content.startsWith(`${prefix}skip`)) {
		if(message.deletable) message.delete();
		skip(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}stop`)) {
		if(message.deletable) message.delete();
		stop(message, serverQueue);
		return;
	} else if (message.content === prefix+"ear") {
		if(message.deletable) message.delete();
		if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply("❌ You don't have permission : ADMINISTRATOR");
		if (!message.member.voiceChannel) return message.reply('Tu doit étre dans un salon vocal pour lancer une musique');
		if (!serverQueue) return message.reply('mdr tes vraiment con a avoir essayer de skip le bot alors que il y a aucune musique de lancer');
		if(serverQueue.connection.dispatcher.volume >= 100) return message.reply(" la music est deja earape");
		serverQueue.connection.dispatcher.setVolume(100);
		return message.reply("musique earape");
	} else if (message.content === prefix+"normale") {
		if(message.deletable) message.delete();
		if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply("❌ Tu n'a pas la permission : ADMINISTRATOR");
		if (!message.member.voiceChannel) return message.reply('Tu doit étre dans un salon vocal pour lancer une musique');
		if (!serverQueue) return message.reply('mdr tes vraiment con a avoir essayer de skip le bot alors que il y a aucune musique de lancer');
		if(serverQueue.connection.dispatcher.volume === 1 / 5) return message.reply(" la music est deja au plus bas");
		serverQueue.connection.dispatcher.setVolume(1 / 5);
		return message.reply("musique normale");
	} else if (message.content.startsWith(prefix+"volum")) {
		if(message.deletable) message.delete();
		if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply("❌ You don't have permission : ADMINISTRATOR");
		if (!serverQueue) return message.reply('mdr tes vraiment con a avoir essayer de skip le bot alors que il y a aucune musique de lancer');
	    if (!message.member.voiceChannel) return message.reply('Tu doit étre dans un salon vocal pour lancer une musique');
		      let args = message.cleanContent
        .split(" ")
        .slice(1)
        .join(" ");
        if(isNaN(Number(args))) return message.reply("put a number not a string ;)");
		if (args >= 126) return message.reply("please put un number not superior to `125`");
		serverQueue.connection.dispatcher.setVolume(args);
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args / 75);
		return message.reply("volume set a : "+args+"%");
	} else if (message.content.startsWith(prefix+"help")) {
		if(message.deletable) message.delete();
		const embedhelp = new Discord.RichEmbed()
			.setColor('#f72819')
			.setTitle("COMMANDS")
			.addField("Jouer une musique", `${prefix}play {URL/ID YOUTUBE}`)
			.addField("Passer a la prochaine musique", `${prefix}skip`)
			.addField("Arreter toutes les musiques", `${prefix}stop`)
			.addField("Changer le volume (De base : 1)", `${prefix}volum {volum (base is 1)}`)
			.setTimestamp()
			.setFooter(message.author.tag, message.author.avatarURL)
		message.channel.send(embedhelp);
	}else if(message.content.startsWith(prefix+"search")){
		let args = message.cleanContent.split(" ").slice(1);
		let sueur = args.slice(0).join(" ");
		ytSearch(sueur, function(err, r) {
			if(err) return console.log(err);
			for (i = 0; i < 5; i++) {
				let viewed = 	approx(r.videos[i].views, {decimal: ','});
				const sendembed_search = new Discord.RichEmbed()
					.setColor('#f72819')
					.setTitle("Recherche N°"+(i+1)+" : "+sueur)
					.addField("```https://www.youtube.com"+r.videos[i].url+"```", "``` Title : "+r.videos[i].title+"\n Views : "+viewed+"\n At : "+r.videos[i].ago+"```")
					.setThumbnail("https://img.youtube.com/vi/" + r.videos[i].videoId + "/hqdefault.jpg")
					.setTimestamp()
					.setFooter(message.author.tag, message.author.avatarURL)
					message.channel.send(sendembed_search);
				}
		});
	}

async function start(message, serverQueue) {
	const textSpilt = message.content.split(' ');
	const voiceChannel = message.member.voiceChannel;
	if (!voiceChannel) return message.reply('Tu doit étre dans un salon vocal pour lancer une musique');
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.reply('Jai pas les permission suffisente pour lancer de la musique sur ce salon >o<');
	}
	const information = await ytdl.getInfo(textSpilt[1]);
	const music = {
		title: information.title,
		url: information.video_url,
		time : information.player_response.videoDetails.lengthSeconds,
		scd : information.player_response.videoDetails.viewCount,
	};
	let audioFormats = ytdl.filterFormats(information.formats, 'audioonly');
	var timed = Number(music.time+"000");
	let view = 	approx(music.scd, {decimal: ','});
	const convertedTime = prettyMilliseconds(timed, {verbose: true});
	const sendembed = new Discord.RichEmbed()
		.setColor('#f72819') // 1337
		.setTitle(music.title) // bite
		.addField("Author : ", "**"+information.author.name+"**", true)
		.addField("Time : ", "**"+convertedTime+"**", true)
		.addField("View : ", "**"+view+"**", true)
		// .addField("Format : ", information.type, true)
		.addField("Description : ","```" + information.description.substring(0,600) + "```")
		.setURL(music.url)
		.setThumbnail("https://img.youtube.com/vi/" + information.video_id + "/hqdefault.jpg")
		.setTimestamp()
		.setFooter(message.author.tag, message.author.avatarURL)
	if (!serverQueue) {
		var Constructe = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 1,
			playing: true,
		};
		queue.set(message.guild.id, Constructe);
		Constructe.songs.push(music);
		try {
			var connection = await voiceChannel.join();
			Constructe.connection = connection;
			play(message.guild, Constructe.songs[0]);

			message.channel.send(sendembed);
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.reply(err);
		}
	} else {
		serverQueue.songs.push(music);
		console.log(serverQueue.songs);
		console.log(information);
		return message.channel.send(sendembed);
	}

}
async function startsearch(message, search, serverQueue) {
	const voiceChannel = message.member.voiceChannel;
	if (!voiceChannel) return message.reply('Tu doit étre dans un salon vocal pour lancer une musique');
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.reply('Jai pas les permission suffisente pour lancer de la musique sur ce salon >o<');
	}
	const information = await ytdl.getInfo(search);
	// console.log(information.videoDetails);
	const music = {
		title: information.title,
		url: information.video_url,
		time : information.player_response.videoDetails.lengthSeconds,
		scd : information.player_response.videoDetails.viewCount,
	};
	let audioFormats = ytdl.filterFormats(information.formats, 'audioonly');
	var timed = Number(music.time+"000");
	let view = 	approx(music.scd, {decimal: ','});
	const convertedTime = prettyMilliseconds(timed, {verbose: true});
	const sendembed = new Discord.RichEmbed()
		.setColor('#f72819')
		.setTitle(music.title)
		.addField("Author : ", "**"+information.author.name+"**", true)
		.addField("Time : ", "**"+convertedTime+"**", true)
		.addField("View : ", "**"+view+"**", true)
		// .addField("Format : ", information.type, true)
		.addField("Description : ","```" + information.description.substring(0,600) + "```")
		.setURL(music.url)
		.setThumbnail("https://img.youtube.com/vi/" + information.video_id + "/hqdefault.jpg")
		.setTimestamp()
		.setFooter(message.author.tag, message.author.avatarURL)
	if (!serverQueue) {
		var Constructe = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 1,
			playing: true,
		};
		queue.set(message.guild.id, Constructe);
		Constructe.songs.push(music);
		try {
			var connection = await voiceChannel.join();
			Constructe.connection = connection;
			play(message.guild, Constructe.songs[0]);

			message.channel.send(sendembed);
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.reply(err);
		}
	} else {
		serverQueue.songs.push(music);
		console.log(serverQueue.songs);
		console.log(information);
		return message.channel.send(sendembed);
	}

}
function play(guild, music) {
	const serverQueue = queue.get(guild.id);

	if (!music) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	const dispatcher = serverQueue.connection.playStream(ytdl(music.url, {filter: 'audioonly'}), { type: 'opus' })
		.on('end', () => {
			console.log('Music ended!');
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => {
			console.error(error);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}
function stop(message, serverQueue) {
	if (!message.member.voiceChannel) return message.channel.send('Tu doit étre dans un salon vocal pour lancer une musique');
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
	message.reply('Ok ok calme toi je me casse oh !');
}
function skip(message, serverQueue) {
	if (!message.member.voiceChannel) return message.channel.send('Tu doit étre dans un vocal pour skip une musique !');
	if (!serverQueue) return message.reply('mdr tes vraiment con a avoir essayer de skip le bot alors que il y a aucune musique de lancer');
	serverQueue.connection.dispatcher.end();
	message.reply('Ok ok calme toi je skip oh !');
}
});
client.login(token);
