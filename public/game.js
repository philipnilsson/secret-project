function eq(x) {
  return function(y) { return x === y; };
}

function keyInputs() {
  var keys = $(document).asEventStream('keydown').map('.keyCode');
  return {
    ups: keys.filter(eq(38)),
    lefts: keys.filter(eq(37)),
    rights: keys.filter(eq(39)),
    downs: keys.filter(eq(40)),
    space: keys.filter(eq(32)),
    ts: Bacon.interval(200)
  }
}

var gameLogic = function(input, board) {
 
  var bk = Block.randomBlock()
  var block = new BlockState(window.blocks[bk], board);
  var bus = new Bacon.Bus()
  
  setTimeout(function() {
      bus.push({block: bk});
  }, 0);
  
  function send(x) {
      bus.push(x);
      if (block.collides()) {
          block.isSet = true;
          bus.push({set: null})
      }
      if (block.collides()) {
          bk = Block.randomBlock()
          block = new BlockState(window.blocks[bk], board);
          bus.push({block: bk});
          if (block.collides()) {
              bus.end()
          }
      }
  }
  
  function sendKey(x, y, rot, event) {
      return function() {
          block = Block.move(x, y, rot)(block);
          send( {keyEvent: event })
      }
  }
  
  input.ups.onValue(sendKey(0, 0, 3, 'up'));
  input.downs.onValue(sendKey(0, 0, 1, 'down'));
  input.lefts.onValue(sendKey(-1, 0, 0, 'left'));
  input.rights.onValue(sendKey(1, 0, 0, 'right'));
  input.ts.onValue(sendKey(0, 1, 0, 'ts'));
  
  input.space.onValue(function() {
      block = block.down();
      send( {keyEvent: 'space' });
  });
  
  return bus;
};

var replayGameLogic = function(bus, board) {
    var blocks = new Bacon.Bus();
    var block;
    
    bus.onValue(function(val) {
        if (val.set) {
            block.isSet = true;
        }
        else if (val.block) {
            block = new BlockState(window.blocks[val.block], board);
        }
        else if (val.keyEvent) {
            var e = val.keyEvent;
            block = Block.moveDir(e, block);
        }
        blocks.push(block);
    });
    
    return blocks
}

function tetris(drawing, input, replay) {
  
  drawing.drawGameArea(w, h);

  var board = new Board(10, 20);
  
  if (!replay)
      bus = gameLogic(input, board);
  else
      bus = input;
  var g = replayGameLogic(bus, board);
  
  g.onValue(function (block) { 
    if (block.isSet) { 
      drawing.setBlock(block, board.set(block));
    }
    drawing.drawBlock(block); 
  });
  
  g.onEnd(function() {
    console.log('you dead');
  })
  
  return bus;
};
