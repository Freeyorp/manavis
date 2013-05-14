"use strict";
/* Deps */
var http = require('http')
  , path = require('path')
  , connect = require('connect')
  , express = require('express')
  , app = express()
  , logger = require('logger').createLogger('manavis.log')
  , cookieParser = express.cookieParser('your secret sauce')
  , sessionStore = new connect.middleware.session.MemoryStore()
  ;

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(cookieParser);
  app.use(express.session({ store: sessionStore }));
  app.use(app.router);
  app.use(express.static(__dirname + "/public"));
});

var server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , SessionSockets = require('session.socket.io')
  , sessionSockets = new SessionSockets(io, sessionStore, cookieParser)
  ;
/* End deps */

/* Only one level is logged, and numerical timestamps are easier to compare. */
logger.format = function(level, date, message) {
  return JSON.stringify({
    date: +date,
    data: JSON.parse(message) /* TODO: Get rid of encoding/decoding hack (write own logger?) */
  });
}

/* Number of sessions we've seen. */
var count = 0;
/* nid -> { nick, filters, channel } */
var users = {};
/* nid -> socket */
var sockets = {};
/* FIXME: Workaround to prevent logout propagating during ghosting */
var ghosting = false;
/* Auto-incrementing room count */
var channelCount = 0;
/* Channel ID -> { usernum, filters } */
var channels = {};

var logServerAction = entityLogger(0);

sessionSockets.on('connection', function (err, socket, session) {
  if (!session) {
    socket.disconnect();
    return;
  }
  /*
   * Don't do anything until they send a login message.
   * Later versions might also check a protocol version here.
   */
  /* Someone new connected. Restore or initialise their session data. */
  session.nid = session.nid || (++count);
  var logAction = entityLogger(session.nid);
  session.nick = session.nick || null;
  session.save();
  if (session.nid in sockets) {
    /* Ghost the old session */
    ghosting = true;
    sockets[session.nid].disconnect();
    ghosting = false;
  }
  sockets[session.nid] = socket;
  /* New user! */
  logAction("CONNECT", { "ip": socket.handshake.address.address, "proxied-ip": socket.handshake.headers['x-forwarded-for'] });
  users[session.nid] = { nick: session.nick, filters: {} };
  /* Let them know of their data. */
  socket.emit('selflogin', {
    id: session.nid,
    nick: session.nick
  });
  /* Let everyone else know that someone connected. */
  socket.broadcast.emit('login', {
    id: session.nid,
    nick: session.nick
  });
  /* Send the new user the userlist. */
  socket.emit('users', { users: users });
  /* Set up various handlers for the new socket. */
  socket.on('nick', function (d) {
    if (!(typeof(d) == "object" && "nick" in d)) {
      return;
    }
    /* TODO Collision checking? */
    users[session.nid].nick = session.nick = d.nick;
    session.save();
    logAction("NICK", d.nick);
    io.sockets.emit('nickset', {
      id: session.nid,
      nick: d.nick
    });
  });
  socket.on('join', function(d) {
    var channel;
    if (d != null) {
      if (!(typeof(d) == "number" && d <= channelCount)) {
        return;
      }
      /* Join an existing channel */
      channel = d;
    } else {
      /* Automagically create a new channel */
      channel = ++channelCount;
    }
    logAction("JOIN", users[session.nid].channel);
    if ("channel" in users[session.nid]) {
      /* Leave any channel we're in */
      socket.leave(users[session.nid].channel);
    }
    /* Inform socket.io about the channel join */
    socket.join(channel);
    /* Let everyone know about the channel join */
    users[session.nid].channel = channel;
    io.sockets.emit('join', {
      id: session.nid,
      channel: channel
    });
    /* Update the channel information */
    if (channel in channels) {
      /* This channel already exists. Inform the joining user of the current filters. */
      socket.emit('filterset', {
        id: 0, /* Server */
        filters: channels[channel].filters
      });
      ++channels[channel].usernum;
    } else {
      /* This channel didn't already exist, so create it and set the filters. */
      channels[channel] = {
        usernum: 1,
        filters: users[session.nid].filters
      };
    }
  });
  socket.on('part', function() {
    if (!users[session.nid].channel) {
      return;
    }
    logAction("PART");
    socket.leave(users[session.nid].channel);
    if (!--channels[users[session.nid].channel].usernum) {
      delete channels[users[session.nid].channel];
    }
    delete users[session.nid].channel;
    io.sockets.emit('part', {
      id: session.nid
    });
  });
  socket.on('filter', function(d) {
    if (!(typeof(d) == "object" && "filters" in d)) {
      return;
    }
    users[session.nid].filters = d.filters;
    logAction("FILTER", d.filters);
    var channel = users[session.nid].channel;
    if (!channel) {
      return;
    }
    channels[channel].filters = d.filters;
    socket.broadcast.to(channel).emit('filterset', {
      id: session.nid,
      filters: d.filters
    });
  });
  socket.on('disconnect', function() {
    if (ghosting) {
      logAction("GHOSTED");
      return;
    }
    logAction("DISCONNECT");
    delete sockets[session.nid];
    delete users[session.nid];
    socket.broadcast.emit('logout', {
      id: session.nid
    });
  });
});

function entityLogger(id) {
  return function(action, content) {
    var message = {
      user:id,
      action:action
    };
    if (arguments.length > 1) {
      message.content = content;
    }
    logger.info(JSON.stringify(message));
  }
}

logServerAction(0, "STARTUP");
server.listen(3000);
