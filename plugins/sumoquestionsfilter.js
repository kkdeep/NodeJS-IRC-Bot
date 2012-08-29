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
    this.kbSearchUrl = this.baseUrl + "/en-US/search?language=en-US&a=1&w=1&q=";
    this.privilegedUsers = ['rosana', 'madalina', 'michelleluna', 'tobbi', 'tobbi_', 'tobbi__'];
    this.defaultMessages = [
        "It's SUMO day! We answerz all the questionz! Go to $unanswered_url to answer some questions, get some information on the wiki $wiki_url, or say !status.",
        "Gimme an 'S', Gimme a 'U', Gimme an 'M', Gimme an 'U'. It's SUMO day!!! Answer questions and help firefox users: $unanswered_url, find more information on the wiki $wiki_url or say !status",
        "Let's rock it!!1one: $unanswered_url or more information on the wiki: $wiki_url. Say !status for status."];
    this.wikiUrl = "http://etherpad.mozilla.org/sumo-questions-day-something";
    
    this.getUniqueRandomNumbers = function(x, max) {
        var randNums = [];
        for(i = 0; i < x; i++) {
            do {
                randNum = Math.floor(Math.random() * max);
            }
            while(randNums.indexOf(randNum) != -1);
            randNums.push(randNum);
        };
        
        return randNums;
    }
    
    /**
     * Returns information about the question with the given index from the current listing
     * @param body: HTML page source
     * @param i: Index of the question
     */
    this.getQuestion = function(questions, i) {
        var q = questions.eq(i);
        var user = $(q).find(".user").text();
        var heading = $(q).find(".content a").text();
        var link = $(q).find(".content a").attr("href");

        return {
            user: user,
            heading: heading,
            link: link
        };
    }
    
    this.postQuestionInfo = function(base, channel, u, question) {
        channel.send(u + ": " + question.user + " needs help with \"" + 
                     question.heading + "\" - " + base + question.link);  
    }
    
    /**
     * Gets a random unanswered question from SUMO
     * @param channel Channel where the !random re-
     * quest was started
     * @user User who requested the status
     */
    this.getRandomQuestion = function(channel, u, m) {
        var base = this.baseUrl;
        var rand = this.getUniqueRandomNumbers;
        var getQuestion = this.getQuestion;
        var postIt = this.postQuestionInfo;
        var numQuestions = parseInt(m.replace("!random", "").trim());
        if(isNaN(numQuestions)) {
            numQuestions = 1;
        }
        if(numQuestions > 5 || numQuestions < 1) {
            channel.send(u + ": " + "Usage: !random <1..5>");
            return;
        }

        request(this.unansweredUrl, function (error, response, body) {
            if (error || response.statusCode != 200) {
                return;
            }
            var questions = $(".question", body);
            var randNum = rand(numQuestions, questions.length);
            if(numQuestions > questions.length)
                numQuestions = questions.length;
            
            for(var i = 0; i < numQuestions; i++) {
                var question = getQuestion(questions, randNum[i]);
                postIt(base, channel, u, question);
            }
        });
    };
    
    
    this.addPrivilegedUser = function(channel, u, m) {
        if($.inArray(u.toLowerCase(), this.privilegedUsers) == -1) {
            channel.send(u + ": You're not allowed to perform this action!");
            return;
        };
        var user = m.replace("!adduser ", "").toLowerCase();
        if($.inArray(user, this.privilegedUsers) != -1) {
            channel.send(user + " is already a privileged user!");
            return;
        }

        this.privilegedUsers.push(user);
        
        channel.send('Added new privileged user ' + user + ". This user will now be able to change the etherpad link and add others to the list of privileged users.");
    };
    
    this.removePrivilegedUser = function(channel, u, m) {
        if($.inArray(u.toLowerCase(), this.privilegedUsers) == -1) {
            channel.send(u + ": You're not allowed to perform this action!");
            return;
        };
        var user = m.replace("!removeuser ", "").toLowerCase();
        
        if($.inArray(user, this.privilegedUsers) == -1) {
            channel.send("I never trusted " + user + " in the first place!");
        }
        else {
            this.privilegedUsers.splice(user, 1);
            channel.send("Removed " + user + " from the list of privileged users.");
        };
    }
    
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
    
    /**
     * Returns questions tagged with the specific tag
     * @param channel: Channel where the request was stated
     * @param u: User who asked for random
     * @param m: Message that contains the tag
     */
    this.getTagged = function(channel, u, m) {
        var base = this.baseUrl;
        var getQuestion = this.getQuestion,
            getRandArray = this.getUniqueRandomNumbers,
            postIt = this.postQuestionInfo;
        var tag = m.replace("!tagged", "").trim();
        var sluggifiedTag = 
                tag.replace(/\s+/g,'-')
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
                randNums = getRandArray(maxQuestions, questions.length);

                for(var i = 0; i < maxQuestions; i++) {
                    var question = getQuestion(questions, randNums[i]);
                    postIt(base, channel, u, question);
                }
            };
        });
    }
    
    /**
     * Returns Knowledge Base results for the specific keyword     
     * @param channel: Channel where the request was stated
     * @param u: User who asked for random
     * @param m: Message that contains the tag
     */
    this.getKbResults = function(channel, u, m) {
        var base = this.baseUrl;
        var keyword = m.replace("!kbsearch", "").trim();
        var url = this.kbSearchUrl + encodeURIComponent(keyword);
        var htmlUrl = url;
        url += "&format=json";
        if(keyword == "") {
            channel.send(u + ": " + "Usage: !kbsearch <search term>");
            return;
        }
        
        request(url, function (error, response, body) {
            if (error || response.statusCode != 200) {
                return;
            };
            
            var results = $.parseJSON(body);
            if(results.total == 0) {
                channel.send(u + ": No results for " + keyword + " found.");
                return;
            }
            
            channel.send(u + ": " + "Found " + results.total + 
                         " results in the Knowledge Base for " + keyword + 
                         ". Showing first three results: ");
                         
            for(var i = 0; i < 3; i++) {
                var result = results.results[i];
                channel.send(u + ": " + result.title + " - " + base + result.url);
            }
            channel.send(u + ": Other results: " + htmlUrl);
        });

    }
    
    /**
     * Returns Knowledge Base results for the specific keyword     
     * @param channel: Channel where the request was stated
     * @param u: User who asked for random
     * @param m: Message that contains the tag
     */
     this.setEtherpadUrl = function(channel, u, m) {
         if($.inArray(u.toLowerCase(), this.privilegedUsers) == -1) {
            channel.send(u + ": You're not allowed to perform this action!");
            return;
         }
         var wikiUrl = m.replace("!etherpad ", "");
         if(wikiUrl.indexOf("etherpad.mozilla.org") == -1) {
            channel.send(u + ": You must be kidding me: That is not a link to a Mozilla Etherpad");
            return;
         };
         this.wikiUrl = wikiUrl;
         channel.send(u + ": Etherpad URL successfully set to " + this.wikiUrl);
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

        case '!info':
            this.getInfo(channel, u);
        break;
    }
    
    if(m.indexOf("!tagged") == 0) {
        this.getTagged(channel, u, m);
    }
    
    if(m.indexOf("!random") == 0) {
        this.getRandomQuestion(channel, u, m);
    }
    
    if(m.indexOf("!kbsearch") == 0) {
        this.getKbResults(channel, u, m);
    }
    
    if(m.indexOf("!etherpad") == 0) {
        this.setEtherpadUrl(channel, u, m);
    }
    
    if(m.indexOf("!adduser") == 0) {
        this.addPrivilegedUser(channel, u, m);
    }
    
    if(m.indexOf("!removeuser") == 0) {
        this.removePrivilegedUser(channel, u, m);
    }
};

// onJoin handler for logging
Plugin.prototype.onJoin = function(msg) {
    var c = msg.arguments[0], // channel
		u = this.irc.user(msg.prefix), // user
        channel = this.irc.channels[c],
        randNum = Math.floor(Math.random() * this.defaultMessages.length),
        currentMessage = this.defaultMessages[randNum]
                             .replace("$unanswered_url", this.unansweredUrl)
                             .replace("$wiki_url", this.wikiUrl);
    
    if(c == "##thefunclubofsumo" && u != "SUMODayBot") {
        channel.send(u + ": " + currentMessage);
    }
};