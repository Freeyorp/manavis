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
  app.use(express.static(__dirname));
});

var server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , SessionSockets = require('session.socket.io')
  , sessionSockets = new SessionSockets(io, sessionStore, cookieParser)
  ;
/* End deps */

/* Only one level is logged, and numerical timestamps are easier to compare. */
logger.format = function(level, date, message) {
  return (+date) + ":" + message;
}

/* Number of sessions we've seen. */
var count = 0;
/* nid -> { nick, filters, following } */
var users = {};

sessionSockets.on('connection', function (err, socket, session) {
  /*
   * Don't do anything until they send a login message.
   * Later versions might also check a protocol version here.
   */
  socket.on('login', function() {
    /* Someone new connected. Restore or initialise their session data. */
    session.nid = session.nid || (++count);
    session.nick = session.nick || null;
    session.save();
    /* New user! */
    logAction("CONNECT", socket.handshake.address.address);
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
      /* TODO Collision checking? */
      users[session.nid].nick = session.nick = d.nick;
      session.save();
      logAction("NICK", d.nick);
      io.sockets.emit('nickset', {
        id: session.nid,
        nick: d.nick
      });
    });
    socket.on('filter', function(d) {
      users[session.nid].filters = d.filters;
      logAction("FILTER", d.filters);
      socket.broadcast.emit('filterset', {
        id: session.nid,
        filters: d.filters
      });
    });
    socket.on('disconnect', function() {
      logAction("DISCONNECT");
      delete users[session.nid];
      socket.broadcast.emit('logout', {
        id: session.nid
      });
    });
  });
  function logAction(action, content) {
    logger.info(session.nid
              , action
              , content
    );
  }
});

logger.info(0, "STARTUP");
server.listen(3000);
