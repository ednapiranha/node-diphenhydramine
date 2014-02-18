# Diphenhydramine

Chat with channels and long-ephemeral messages.

## Installation

    npm install

## Usage

    var diphenhydramine = new Diphenhydramine();

## Add a chat message

    diphenhydramine.addChat('test message', 'channelname',  {
      ttl: 10000,
      media: 'http://someimage.jpg',
      fingerprint: '111'
    }, function (err, c) {
      if (!err) {
        console.log(c);
      }
    });

Note: 'channelname' cannot be empty and must only contain alphanumeric characters. Any other characters will be removed automatically.

### Get all chats

    diphenhydramine.getChats(<reverse>, 'channelname', function (err, c) {
      if (!err) {
        console.log(c);
      }
    });

`reverse` is an optional boolean to reverse the chat history from latest -> earliest. Defaults at earliest -> latest.

## Tests

    make test
