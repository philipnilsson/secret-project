/*jshint loopfunc: true */

window.blocks =
    {
        Z: {
            pieces: ['...',
                     'xx.',
                     '.xx'],
            x: 1,
            y : 1,
            rot: 2
        },
        S: {
            pieces: ['...',
                     '.xx',
                     'xx.'],
            x: 1,
            y: 1,
            rot: 2
        },
        T: {
            pieces: ['.x.',
                     'xxx',
                     '...'],
            x: 1,
            y: 1,
            rot: 4
        },
        J: {
            pieces: ['x..',
                     'xxx',
                     '...'],
            x : 1,
            y: 1,
            rot: 4
        },
        L: {
            pieces: ['...',
                     'xxx',
                     'x..'],
            x: 1,
            y: 1,
            rot: 4
        },
        I: {
            pieces: ['....',
                     '....',
                     'xxxx',
                     '....',
                     '....'],
            x: 2,
            y : 2,
            rot: 2
        },
        O: {
            pieces: ['xx',
                     'xx'],
            x: 0,
            y: 0,
            rot: 0
        }
    };

function Block(arr, x, y, maxRot) {
    "use strict";
    var self = this;
    this.get = function (i, j, rot) {
        rot %= maxRot;
        if (rot === 1 || rot === 2) {
            i = 2 * x - i;
        }
        if (rot === 2 || rot === 3) {
            j = 2 * y - j;
        }
        if (rot === 1 || rot === 3) {
            var tmp = j;
            j = i;
            i = tmp;
        }
        return (arr[i] || [])[j] || false;
    };
}

Block.move = function(x,y,rot) { 
  return function(st) { return st.tryMove(x,y,rot); };
};

Block.moveDir = function(dir, block) {
    if (dir == 'up')
        return Block.move(0, 0, 3)(block);
    else if (dir == 'down')
        return Block.move(0, 0, 1)(block);
    else if (dir === 'left')
        return Block.move(-1, 0, 0)(block);
    else if (dir === 'right')
        return Block.move(1, 0, 0)(block);
    else if (dir === 'ts')
        return Block.move(0, 1, 0)(block);
    else if (dir === 'space')
        return block.down()
}    

Block.randomBlock = function randomBlock() {
  var ts = Object.keys(blocks);
  return ts[Math.floor(Math.random() * ts.length)];
};

function BlockState(block, board, rot, x, y, isSet) {
    "use strict";
    var self = this;
    if (x === undefined) {
        x = 5;
    }
    if (y === undefined) {
        y = 0;
    }
    if (rot === undefined) {
        rot = 0;
    }
    this.block = block;
    this.board = board;
    this.x = x;
    this.y = y;
    this.rot = rot % 4;
    this.isSet = isSet;

    this.tryMove = function (x, y, rot) {
        var newSt = new BlockState(block, board, self.rot + rot, self.x + x, self.y + y);
        if (newSt.collides()) {
            this.isSet = y > 0;
            return self;
        }
        return newSt;
    };
    this.collides = function () {
        return self.board.collides(self);
    };
    this.down = function () {
        while (!this.collides()) {
            this.y++;
        }
        this.y--;
        this.isSet = true;
        return this;
    };
}

function Board(w, h) {

    "use strict";
    var self = this,
        i = 0;
    this.arr = [];
    this.w = w;
    this.h = h;
    for (i = 0; i < h; i += 1) {
        self.arr.push(new Array(w));
    }

    this.collides = function (st) {
        for (var i = 0; i < 5; i++)
            for (var j = 0; j < 5; j++) {
                var ai = st.y + i, aj = st.x + j;
                var cellInBoard = (self.arr[ai]||[])[aj];
                var outside     = ai >= self.h || aj < 0 || aj >= self.w;
                var cellInBlock = st.block.get(i,j, st.rot);
                if (cellInBlock && (cellInBoard || outside))
                    return true;
            }
        return false;
    };

    this.set = function (st) {
        var lines = [];
        for (var i = 0; i < 5; i++)
            for (var j = 0; j < 5; j++)
                if (st.block.get(i, j, st.rot))
                    (self.arr[st.y + i]||[])[st.x + j] = true;
        for (i = 0; i < self.arr.length; i++)
            if (Bacon._.all(self.arr[i])) {
                self.arr.splice(i, 1);
                lines.push(i--);
            }
        while (self.arr.length < self.h)
            self.arr.unshift(new Array(self.w));
        return lines;
    };
}

for (var type in blocks) {
    blocks[type].pieces = blocks[type].pieces.map(function(s) {
        return s.split('').map(function(c) {
            return c === 'x';
        });
    });
    blocks[type] = new Block(
        blocks[type].pieces,
        blocks[type].x,
        blocks[type].y,
        blocks[type].rot);
}
