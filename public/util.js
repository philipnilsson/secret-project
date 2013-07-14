
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

eventCounter = 0;
Bacon.Observable.prototype.withMeta = function(id) {
    return this.map(function(x) {
        x.i = eventCounter++;
        x.id = id;
        return x;
    });
}

Bacon.Observable.prototype.takeWhile = function(obs) {
    return this.takeUntil(obs.filter(false).mapEnd(true))
}
