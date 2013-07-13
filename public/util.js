
Bacon.fromIO = function fromIO(socket, event) {
    return new Bacon.EventStream(function(sink) {
        socket.on(event, function(data) {
            sink(new Bacon.Next(data));
        });
        return function() { }
    });
}

Bacon.Observable.prototype.emit = function(sockets, event) {
    this.onValue(function(data) {
        sockets.emit(event, data);
    });
}
