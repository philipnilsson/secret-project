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
    socket.emit('message', { message: 'welcome to the chat' });
    socket.on('host', function() {
        leaveAll(socket);
        var room = socket.join('room' + ++roomNo);
        socket.emit('hosted', io.sockets.clients(room));
    });
    socket.on('list rooms', function () { 
        leaveAll(socket);
        socket.emit('rooms', io.sockets.manager.rooms)
    });
    socket.on('join', function(room) {
        if (room.indexOf('/') == 0)
            room = room.substring(1);
        socket.join(room);
        var ids = io.sockets.clients(room).map(function(x) {
            return x.id;
        })
        io.sockets.in(room).emit('joined', {
            players: ids
        });
    });
    socket.on('startGame', function() {
        var room = io.sockets.manager.roomClients[socket.id][0];
        io.sockets.in(room).emit('start');
    });
    
    socket.on('send', function (data) {
        io.sockets.emit('message', data);
    });
});



// Bacon.Observable.emit = function(sockets, event) {
//     this.onValue(function(data) {
//         sockets.emit(event, data);
//     });
// }


console.log("Listening on port " + port);

