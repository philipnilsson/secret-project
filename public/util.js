
function fromIO(socket, event) {
    return new Bacon.EventStream(function(sink) {
        socket.on(event, function(data) {
            sink(data);
        });
    });
}

Bacon.Observable.emit = function(sockets, event) {
    this.onValue(function(data) {
        sockets.emit(event, data);
    });
}
