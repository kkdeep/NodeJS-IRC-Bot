/**
 * IRC Bot
 *
 * @author		Michael Owens
 * @website		http://www.michaelowens.nl
 * @copyright	Michael Owens 2011
 */
var sys = require('util'),
	irc = require('./irc');

/**
 * Config
 */
var config = {
	host:		'irc.mozilla.org',
	port:		6667,
	nick:		'SUMODayBot',
	username:	'SUMODayBot',
	realname:	'Powered by Michael Owens',
	channels:	['#thefunclubofsumo', '#sumo', '#lizardlounge'],
	command:	'.',
	debug:		true,
	plugins:	['global', 'reload', 'gezien', 'sumoquestionsfilter']
};

/**
 * Let's power up
 */
var ircClient = new irc.Server(config);
ircClient.connect();