const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const data = require("./data.json");
let servers = require("./variables.json");
let messages = {};
const config = require('./config.json');
const nektar = config.nektar;

var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

bot.on("ready",async ()=>{
    initialize();
    bot.setInterval(function(){
        initialize();
    },1000*60*60*24);
    console.log("The Bot is Online Nek!");
});

function initialize(){
    let today = days[new Date().getDay()];
    let list = [];
    // put all the classes that are due to today in an array
    for (i in data){
        for (j in data[i].days){
            if (data[i].days[j].day == today){
                list.push({name:data[i].name,link:data[i].link,starting_hour:data[i].days[j].hours[0],ending_hour:data[i].days[j].hours[1]});
            }
        }
    }
    // sort the array
    list.sort((a,b) => (a.starting_hour > b.starting_hour) ? 1 : ((b.starting_hour > a.starting_hour) ? -1 : 0));
    
    //send all the messages
    for (obj of list){
        schedule(obj);
    }
}

//schedules a class message to be sent
async function schedule(obj){
    let right_now = new Date();
    let hour = right_now.getHours();
    let minute = right_now.getMinutes();
    let current_time = hour*60 + minute;
    console.log("Will post [" + obj.name + "] , in : " + (obj.starting_hour*60 - current_time).toString() + " minutes.");
    bot.setTimeout(() => {
        sendmessage(obj);
        console.log("Posted a message");
    }, (obj.starting_hour*60 - current_time - 5)*60*1000);
    return true;
}

async function sendmessage(obj){
    for (guild in servers){
        try {
            // delete the "Δεν πραγματοποιητε μαθημα" μηνυμα
            if (messages[guild]){
                //await bot.channels.cache.get(servers[guild]).messages.fetch(messages[guild].id).delete();
            }
            // post the message on the channel
            console.log("sent message");
            await bot.channels.cache.get(servers[guild]).send(
                new Discord.MessageEmbed()
                .setTitle("ΤΩΡΑ ΕΧΕΙ ΜΑΘΗΜΑ")
                .setURL(obj.link)
                .setColor("#0099ff")
                .setThumbnail("https://images-ext-2.discordapp.net/external/UkX4VyVlMxh6IcSUheoenOeKPdEBzXmRfbj0nx35gdI/https/www.ceid.upatras.gr/sites/all/themes/ceid_theme/logo.png")
                .setDescription(`Το Μάθημα **${obj.name}**\nΣυμβαινει αυτην την στιγμη (${obj.starting_hour}:00 με ${obj.ending_hour}:00)\n\nΜπες με αυτο το λινκ : \n\n` + "`" + obj.link + "`")
                .setFooter("ή πάτα τον τίτλο")
                .setTimestamp()
            ).then(msg=>{
                messages[guild] = {
                    channel:servers[guild],
                    id:msg.id
                };
            });
            // edit it after the class is done σε "Δεν πραγματοποιητε μαθημα αυτην την στιγμη"
            bot.setTimeout(async function(){
                await bot.channels.cache.get(servers[guild]).messages.fetch(messages[guild].id).then(msg=>{msg.edit(new Discord.MessageEmbed().setTitle("ΤΩΡΑ ΔΕΝ ΕΧΕΙ ΜΑΘΗΜΑ").setColor("#0099ff").setDescription("Δεν πραγματοποιήτε μάθημα αυτην την στιγμή").setTimestamp().setThumbnail("https://images-ext-2.discordapp.net/external/UkX4VyVlMxh6IcSUheoenOeKPdEBzXmRfbj0nx35gdI/https/www.ceid.upatras.gr/sites/all/themes/ceid_theme/logo.png"));});
            },(obj.ending_hour*60 - obj.starting_hour*60 - 15) * 1000 * 60 );
        } catch (err) {console.error(err);}
    }
}

bot.on("message",message=>{
    if (message.author.bot){return;}
    if (message.channel.type == "dm") {return;}
    if (message.author.id == nektar ){
        let args = message.content.split(" ");
        switch(args[0].toLocaleLowerCase()){
            case '/setchannel':
                servers[message.guild.id] = message.channel.id;
                message.react("👍");
                fs.writeFile("./variables.json", JSON.stringify(servers), (err) => { if (err) console.log(err) });
            break;
            case '/unsetchannel':
                delete servers[message.guild.id];
                message.react("👍");
                fs.writeFile("./variables.json", JSON.stringify(servers), (err) => { if (err) console.log(err) });
        }
    }
});

//bot.channels.cache.get("816646510305083403").messages.fetch("817081891131359312").then(msg =>{msg.delete();});
//bot.channels.cache.get("816646510305083403").messages.fetch("817081892662280194").then(msg=>{msg.edit(new Discord.MessageEmbed().setTitle("ΤΩΡΑ ΔΕΝ ΕΧΕΙ ΜΑΘΗΜΑ").setColor("#0099ff").setDescription("Δεν πραγματοποιήτε μάθημα αυτην την στιγμή").setTimestamp().setThumbnail("https://images-ext-2.discordapp.net/external/UkX4VyVlMxh6IcSUheoenOeKPdEBzXmRfbj0nx35gdI/https/www.ceid.upatras.gr/sites/all/themes/ceid_theme/logo.png"));});

bot.login(config.token);