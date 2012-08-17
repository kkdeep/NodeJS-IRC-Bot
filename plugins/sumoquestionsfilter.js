/**
 * SUMO Questions Filter Plugin
 *
 * @author		Tobias Markus
 * @copyright	Tobias Markus, 2012
 */
var sys = require('util');
var request = require('request');
var $ = require('jQuery');

Plugin = exports.Plugin = function(irc) {
	this.name = 'sumoquestionsfilter';
	this.title = 'SUMO Questions Filter';
	this.version = '0.1';
	this.author = 'Tobias Markus';

	this.irc = irc;
    this.baseUrl = "https://support.mozilla.org";
    this.unansweredUrl = this.baseUrl + "/en-US/questions?filter=no-replies";
    
    this.rand = function(max) {
        return Math.floor(Math.random() * max);
    };
    
    /**
     * Gets a random unanswered question from SUMO
     * @param channel Channel where the !random re-
     * quest was started
     * @user User who requested the status
     */
    this.getRandomQuestion = function(channel, u) {
        var base = this.baseUrl;
        var rand = this.rand;

        request(this.unansweredUrl, function (error, response, body) {
            if (error || response.statusCode != 200) {
                return;
            }

            var questions = $(".question", body);
            var randNum = rand(questions.length);
            var question = questions.eq(randNum);
            var user = $(question).find(".user").text();
            var heading = $(question).find(".content a").text();
            var link = $(question).find(".content a").attr("href");
            channel.send(
                u + ": " + user + " needs help with \"" + 
                heading + "\" - " + base + link);
        });
    };
    
    /**
     * Gets the current status of the unanswered forum threads
     * @param channel - Channel where the request was started
     * @param user - User who requested the status
     */
    this.getStatus = function(channel, u) {
        var url = this.unansweredUrl;
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                channel.send(u + ": " + 
                             $('.no-reply', body).text().trim() 
                             + " - " + url);
            }
        });
    }
    
    /**
     * Returns bot information
     * @param channel - Channel where the request was started
     * @param user - User who requested the status
     */
    this.getInfo = function(channel, u) {
        channel.send(u + ': ' + "*** BOT INFO ***:");
        channel.send(" This is an IRC bot running on node.js forked from");
        channel.send("https://github.com/ktiedt/NodeJS-IRC-Bot");
        channel.send("Custom SUMO plugin written by");
        channel.send("Tobias 'Tobbi' Markus and available under the terms of the");
        channel.send("MPL. See http://www.mozilla.org/MPL/1.1/ for further details.");
    }
    
    this.getTagged = function(channel, u, m) {
        var base = this.baseUrl;
        var rand = this.rand, randNums = [];
        var tag = m.replace("!tagged", "").trim();
        var sluggifiedTag = tag.replace(/\s+/g,'-')
                   .replace(/[^a-zA-Z0-9\-]/g,'')
                   .toLowerCase();

        if(tag == "") {
            channel.send(u + ": " + "Usage: !tagged <tag name>");
            return;
        }
        var url = this.unansweredUrl + "&tagged=" + sluggifiedTag;
        var maxQuestions;
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var questions = $(".question", body);
                if(questions.length > 3) {
                    maxQuestions = 3;
                }
                else {
                    maxQuestions = questions.length;
                };
                if(maxQuestions > 0)
                    channel.send(maxQuestions + " unanswered questions matching the tag " + tag + " coming up:");
                else
                    channel.send("No unanswered questions matching the tag " + tag + " found");

                for(var i = 0; i < maxQuestions; i++) {
                    do {
                        randNum = rand(questions.length);
                    }
                    while(randNums.indexOf(randNum) != -1);

                    randNums.push(randNum);

                    var question = questions.eq(randNum);
                    var user = $(question).find(".user").text();
                    var heading = $(question).find(".content a").text();
                    var link = $(question).find(".content a").attr("href");
                    channel.send(
                        user + " needs help with \"" + 
                        heading + "\" - " + base + link);
                    }
                };
        });
    }
};

Plugin.prototype.onMessage = function(msg) {
	var c = msg.arguments[0], // channel
		u = this.irc.user(msg.prefix), // user
		m = msg.arguments[1].toLowerCase(), // message
        channel = this.irc.channels[c];
        
        console.log("Channel: " + c);
        console.log("User: " + u);
        console.log("Message: " + m);
        
        if(!channel || !user) {
            return;
        }
        
    switch(m) {
        case '!status':
        case '!check':
            this.getStatus(channel, u);
        break;
        
        case '!random':
            this.getRandomQuestion(channel, u);
        break;
        
        case '!info':
            this.getInfo(channel, u);
        break;
    }
    
    if(m.indexOf("!tagged") == 0) {
        this.getTagged(channel, u, m);
    }
};

// onJoin handler for logging
Plugin.prototype.onJoin = function(msg) {
    var c = msg.arguments[0], // channel
		u = this.irc.user(msg.prefix), // user
        channel = this.irc.channels[c];
    
    if(c == "#thefunclubofsumo") {
        channel.send("Welcome to the SUMO hangout channel. I'm just testing sending a message to every user that joins, in order to field-test the behaviour on a SUMO day. This can as well ping the specific user.");
    }
    //channel.send(u + ": Welcome to SUMO day! Help us answer questions in the support forum! Say !status to get the number of open questions or !random to get a random question.");
};