'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var child = require('child_process');
var concat = require('concat-stream');
var Diphenhydramine = require('../main');

var p = new Diphenhydramine({
  db: './test/db',
  frequency: 1,
  ttl: 1
});

describe('diphenhydramine', function () {
  after(function () {
    child.exec('rm -rf ./test/db/*');
  });

  describe('.addChat', function () {
    it('should add a new chat in a channel', function (done) {
      p.addChat('test message 0', 'channel', false, function (err, c) {
        should.exist(c);
        c.message.should.eql('test message 0');
        done();
      });
    });

    it('should add an additional number of chats and only keep 25', function (done) {
      for (var i = 1; i < 30; i ++) {
        p.addChat('test message ' + i, 'channel', false, function (err, c) {
          console.log(c.message);
        });
      }

      setTimeout(function () {
        var channel = p.getChannel('channel');

        var rs = channel.createReadStream();

        rs.pipe(concat(function (chats) {
          chats.length.should.equal(25);
          done();
        }));

        rs.on('error', function (err) {
          console.error(err);
        });
      }, 2500);
    });

    it('should not add a new chat', function (done) {
      p.addChat('test message', '', false, function (err, c) {
        should.exist(err);
        done();
      });
    });
  });

  describe('.getChats', function () {
    it('should get chats from a channel', function (done) {
      p.getChats('channel', false, function (err, c) {
        should.exist(c);
        c.chats.length.should.equal(25);
        done();
      });
    });
  });
});
