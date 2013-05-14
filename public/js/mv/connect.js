"use strict";
var mv = function(mv) {
  mv.connect = {
    connect: connect,
    join: join,
    part: part
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
    socket = io.connect();
    /* These are still useful to troubleshoot */
    socket.on("connect", function() {
      console.log("CONNECT", arguments);
    });
    socket.on("disconnect", function() {
      console.log("DISCONNECT", arguments);
      d3.select("#connection-warning").style("display", "block");
    });
    /* We're evidently operating online, so show the status */
    d3.select("#connect-status").style("display", "block");
    /* Tell the server our starting filters */
    socket.emit("filter", { filters: mv.charter.filters() });
    /*
     * Protocol:
     *  selflogin -> id (I)
     *  login -> id (I), nick (S)
     *  nickset -> id (I), nick (S)
     *  join -> id (I), channel (I)
     *  part -> id (I)
     *  filterset -> id (I), filters ({dim (S) -> filter (*)})
     *  users -> { id -> { nick (S), channel (I), filters ({dim (S) -> filter (*)}) } }
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
    socket.on('join', function(d) {
      users[d.id].channel = d.channel;
      updateUsersStatus();
    });
    socket.on('part', function(d) {
      delete users[d.id].channel;
      updateUsersStatus();
    });
    socket.on('filterset', function(d) {
      /* Someone changed their filter */
      /* Ignore server sourced (ID: 0) changes */
      if (d.id) {
        users[d.id].filters = d.filters;
      }
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
      if (key == "date") {
        /*
         * Special case! FIXME: Find a more elegant way to handle this
         */
        filters[key][0] = new Date(filters[key][0]);
        filters[key][1] = new Date(filters[key][1]);
      }
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
  function join(channel) {
    if (channel != null) {
      socket.emit("join", channel);
    } else {
      socket.emit("join");
    }
  }
  function part() {
    socket.emit("part");
  }
  function updateUsersStatus() {
    /* Convert the user list to a form suitable for a d3 selection */
    var groups = [];
    /* Track the groupless people separately. They should come at the end. */
    var unchannelled = [];
    var channelById = {};
    var channelNames = [];
    for (var uid in users) {
      users[uid].id = uid;
      if ("channel" in users[uid]) {
        if (!(users[uid].channel in channelById)) {
          groups.push(channelById[users[uid].channel] = []);
          channelNames.push(users[uid].channel);
        }
        channelById[users[uid].channel].push(users[uid]);
      } else {
        unchannelled.push(users[uid]);
      }
    }
    groups.push(unchannelled);
        var createpart = usersStatus.select(".createpart");
    /* Link to part a channel we're in, or create a channel if we're not in one */
    if (createpart.empty()) {
      createpart = usersStatus.append("a")
        .attr("class", "createpart")
      ;
    }
    if ("channel" in users[id]) {
      createpart
        .attr("href", "javascript:mv.connect.part();")
        .text("Part channel")
      ;
    } else {
      createpart
        .attr("href", "javascript:mv.connect.join();")
        .text("Create channel")
      ;
    }
    /* List of groups, with unchanneled users at the end */
    var grouplist = usersStatus.selectAll(".group")
      .data(groups, function(d, i) { return channelNames[i]; })
    ;
    grouplist
      .enter().append("div").attr("class", "group")
    ;
    /* Update */
    grouplist
      .each(function(d, i) {
        var group = d3.select(this);
        var ul = group.select("ul");
        if (ul.empty()) {
          ul = group.append("ul");
        }
        /*
         * Hacky way to check if these are the users without a channel.
         * Feel free to FIXME!
         */
        if (i != groups.length - 1) {
          group
            .attr("class", "group channel")
          ;
          var join = group.select(".join");
          if (join.empty()) {
            join = group.append("a")
              .attr("class", "join")
              .attr("href", "javascript:mv.connect.join(" + channelNames[i] + ");")
              .text("Join channel")
            ;
          }
          if (users[id].channel == channelNames[i]) {
            /* We're in this channel */
            join.style("display", "none");
          } else {
            join.style("display", "inline");
          }
        } else {
          var join = group.select(".join");
          group
            .attr("class", "group")
          ;
          if (join.empty()) {
            join.remove();
          }
        }
        /* Update the list of users in this group */
        var userlist = ul.selectAll(".user")
          .data(d, function(d) { return d.id; })
        ;
        userlist
          .enter().append("li").attr("class", "user")
        ;
        userlist
          .each(function(d,i) {
            var elm = d3.select(this);
            var name = elm.select(".name");
            var nick = d.nick == null ? "Anonymous User " + d.id : d.nick;
            if (d.id == id) {
              /* This is us! We can edit our name. */
              if (name.empty()) {
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
        userlist
          .exit().remove()
        ;
      })
    ;
    grouplist
      .exit().remove()
    ;
  }
  return mv;
}(mv || {});
