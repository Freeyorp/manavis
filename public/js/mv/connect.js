"use strict";
var mv = function(mv) {
  mv.socket = {
    connect: connect
  };
  /* If we're updating due to something we received, then don't broadcast back. */
  var netrendering = false;
  /* Our ID */
  var id = 0;
  /* List of all users */
  var users = {};
  /* The user status box */
  var usersStatus = d3.select("#users-status");
  /* io.socket's socket */
  var socket;
  function connect() {
    socket = io.connect('http://localhost:3000');
    socket.on("connect", function() { console.log("CONNECT", arguments); });
    socket.on("disconnect", function() { console.log("DISCONNECT", arguments); });
    socket.emit('login');
    /*
     * Protocol:
     *  selflogin -> id (I)
     *  login -> id (I), nick (S)
     *  nickset -> id (I), nick (S)
     *  users -> { id -> {nick (S), filters ({dim (S) -> filter (*)}) } }
     *  logout -> id (I)
     */
    socket.on('selflogin', function(d) {
      /* Acknowledged that we logged in */
      /* Take note of our ID. */
      id = d.id;
    });
    socket.on('login', function(d) {
      /* Someone else logging in */
      users[d.id] = { nick: d.nick, filters: {} };
      updateUsersStatus();
    });
    socket.on('users', function(d) {
      /* We've got a list of all users. */
      /* The server is always right. */
      users = d.users;
      updateUsersStatus();
    });
    socket.on('nickset', function(d) {
      /* Someone, possibly us, changed their nick. */
      users[d.id].nick = d.nick;
      updateUsersStatus();
    });
    socket.on('filterset', function(d) {
      /* Someone changed their filter */
      users[d.id].filters = d.filters;
      /* Use the variable netrendering to denote that we're rendering due to a change received from the network. */
      netrendering = true;
      setOwnFilters(d.filters);
      netrendering = false;
    });
    socket.on('logout', function(d) {
      /* Someone disconnected, take them off the list. */
      delete users[d.id];
      updateUsersStatus();
    });
    /*
     * Remember the old renderlet
     * FIXME: Find a more elegant way to do this
     */
    var f = dc.renderlet();
    dc.renderlet(function() {
      /* Hook a listener into dc's rendering routine. If it rerenders, broadcast the change. */
      if (netrendering) {
        /* If we rendered due a change we received, don't broadcast it again. That would be A Bad Thing. */
        return;
      }
      socket.emit("filter", { filters: mv.charter.filters() });
      /* Call the old renderlet */
      f();
    });
  }
  function setOwnFilters(filters) {
    /* See if there's any difference - if there isn't, don't update. */
    var change = false;
    var key;
    /* Check for keys in the filters to apply which are not in our charts. */
    for (key in filters) {
      if (!(key in mv.charts))
        continue;
      var filter = mv.charts[key].filter();
      if (typeof(filter) == "array") {
        /* Crossfilter uses arrays to filter ranges. Exactly the first two elements are significant. */
        if (filter[0] == filters[key][0] &&
            filter[1] == filters[key][1]) {
          continue;
        }
      } else if (filter == filters[key]) {
        continue;
      }
      /* This filter differs. Apply it. */
      change = true;
      mv.charts[key].filter(filters[key]);
    }
    /* Check for keys in our charts which are not in the filters to apply. */
    for (key in mv.charts) {
      if (mv.charts[key].filter() != null) {
        if (key in filters) {
          /* This has already been handled above */
          continue;
        }
        /* There is no longer a filter applying here, clear it. */
        change = true;
        mv.charts[key].filterAll();
      }
    }
    if (change) {
      dc.redrawAll();
    }
  }
  function updateUsersStatus() {
    /* Convert the user list to a form suitable for a d3 selection */
    var data = [];
    for (var uid in users) { users[uid].id = uid; data.push(users[uid]); }
    /* Data join */
    var userlist = usersStatus.selectAll(".user")
      .data(data, function(d) { return d.id; });
    /* Enter */
    userlist
      .enter().append("li").attr("class", "user")
    ;
    /* Update */
    userlist
      .each(function(d,i) {
        var elm = d3.select(this);
        console.log("Userlist para appending", d,i);
        var name = elm.select(".name");
        var nick = d.nick == null ? "Anonymous User " + d.id : d.nick;
        if (d.id == id) {
          /* This is us! We can edit our name. */
          if (name.empty()) {
            console.log("Found our entry. id:", id, "datum", d);
            name = elm.append("input").attr("class", "name")
              .attr("type", "text")
              .attr("placeholder", "Enter name here")
              .on("change", function () {
                /* A d3 select must be dereferenced twice to access the DOM entity */
                socket.emit("nick", { nick: name[0][0].value });
              })
            ;
          }
          name.attr("value", nick);
        } else {
          /* This is someone else. We can't edit their name. */
          if (name.empty()) {
            name = elm.append("p").attr("class", "name");
          }
          name.text(nick);
        }
      })
    ;
    /* Remove */
    userlist
      .exit().remove()
    ;
  }
  return mv;
}(mv || {});
