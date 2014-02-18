'use strict';

var level = require('level');
var ttl = require('level-ttl');
var uuid = require('uuid');
var Sublevel = require('level-sublevel');
var concat = require('concat-stream');

var Diphenhydramine = function (options) {
  var self = this;

  var DEFAULT_TTL = 10000;
  var CHAT_LIMIT = 25;

  var setTime = function () {
    return Date.now();
  };

  if (!options) {
    options = {};
  }

  this.channels = {};
  this.ttl = parseInt(options.ttl || DEFAULT_TTL, 10);
  this.dbPath = options.db || './db';
  this.limit = parseInt(options.limit || CHAT_LIMIT, 10);

  var sendChat = function (key, chat, created, options, callback) {
    callback(null, {
      message: chat,
      fingerprint: options.fingerprint || '',
      media: options.media || false,
      key: key,
      created: created
    });
  };

  var setChannel = function (channel, callback) {
    channel = channel.toString().replace(/[^\w+]/gi, '').toLowerCase();

    if (channel.length < 1) {
      callback(new Error('Invalid channel name'));
      return;
    }

    if (!self.channels[channel]) {
      self.channels[channel] = Sublevel(level(self.dbPath + '/' + channel, {
        createIfMissing: true,
        valueEncoding: 'json'
      }));

      self.channels[channel] = ttl(self.channels[channel], {
        checkFrequency: options.frequency || self.ttl
      });
    }

    callback(null, channel);
  };

  this.getChannel = function (channel) {
    return self.channels[channel] || false;
  };

  this.getChat = function (key, channel, callback) {
    setChannel(channel, function (err, channelName) {
      if (err) {
        callback(err);
      } else {
        self.channels[channelName].get(key, function (err, chat) {
          if (err || !chat) {
            callback(new Error('Chat not found'));
          } else {
            callback(null, chat);
          }
        });
      }
    });
  };

  this.getChats = function (channel, reverse, callback) {
    setChannel(channel, function (err, channelName) {
      if (err) {
        callback(err);
      } else {
        var rs = self.channels[channelName].createReadStream({
          limit: self.limit,
          reverse: reverse
        });

        rs.pipe(concat(function (chats) {
          callback(null, {
            chats: chats
          });
        }));

        rs.on('error', function (err) {
          callback(err);
        });
      }
    });
  };

  var timeoutArchive = function (channel) {
    var rs = self.channels[channel].createReadStream({
      reverse: true
    });

    rs.pipe(concat(function (chats) {
      if (chats.length > self.limit) {
        for (var i = 0; i < chats.length - self.limit; i ++) {
          self.channels[channel].put(chats[i].key, {}, {
            ttl: self.ttl
          });
        }
      }
    }));

    rs.on('error', function (err) {
      console.error(err);
    });
  };

  this.addChat = function (chat, channel, options, callback) {
    setChannel(channel, function (err, channelName) {
      if (err) {
        callback(err);
      } else {
        if (!options) {
          options = {};
        }

        var created = setTime();
        var key = setTime() + '!' + uuid.v4();

        self.channels[channel].put(key, {
          fingerprint: options.fingerprint || '',
          message: chat,
          media: options.media || false,
          created: created
        }, function (err) {
          if (err) {
            callback(err);
          } else {
            timeoutArchive(channel);
            sendChat(key, chat, created, options, callback);
          }
        });
      }
    });
  };
};

module.exports = Diphenhydramine;
