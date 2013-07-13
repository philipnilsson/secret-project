var express = require("express");
var app = express();
var port = 3700;
 

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.get("/", function(req, res){
    res.render("page");
});

app.use(express.static(__dirname + '/public'));
 
var io = require('socket.io').listen(app.listen(port));

var roomNo = 0;

function leaveAll(socket) {
    for (var i in io.sockets.manager.rooms) {
        if (i.indexOf('/') == 0)
            socket.leave(i.substring(1));
    }
}

io.sockets.on('connection', function (socket) {
    socket.emit('message', { message: 'welcome to the chat', id: socket.id });
    socket.on('host', function() {
        leaveAll(socket);
        var room = socket.join('room' + ++roomNo);
        socket.emit('hosted', io.sockets.clients(room));
    });
    socket.on('list rooms', function () { 
        leaveAll(socket);
        socket.emit('rooms', io.sockets.manager.rooms)
    });
    
    function idsInRoom(room) {
        return io.sockets.clients(room).map(function(x) {
            return x.id;
        })
    }
    
    socket.on('join', function(room) {
        if (room.indexOf('/') == 0)
            room = room.substring(1);
        socket.join(room);
        io.sockets.in(room).emit('joined', {
            players: idsInRoom(room)
        });
    });
    
    function getRoom(socket) {
        return io.sockets.manager.roomClients[socket.id][0];
    }
    
    socket.on('startGame', function() {
        var room = getRoom(socket);
        io.sockets.in(room).emit('start', idsInRoom());
    });
    
    socket.on('send', function (data) {
        io.sockets.emit('message', data);
    });

    function passthrough(event) {
      socket.on(event, function (data) {
          var room = getRoom(socket);
          socket.broadcast.to(room).emit(event, socket.id)
      })
    }

    ['ups', 'downs', 'lefts', 'rights', 'ts', 'space'].map(passthrough);

});

console.log("Listening on port " + port);

