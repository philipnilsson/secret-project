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

var gameLogic = function(makeBlock, input, board) {
 
  var bk = window.blocks[Block.randomBlock()]
  var block = new BlockState(bk, board);
  var bus = new Bacon.Bus()
  var blocks = new Bacon.Bus()
  
  bus.push({block: bk});
  blocks.push(block);
  
  function send(x) {
      bus.push(x);
      if (block.collides()) 
          block.isSet = true;
      blocks.push(block);
      if (block.collides()) {
          bk = window.blocks[Block.randomBlock()]
          block = new BlockState(bk, board);
          bus.push({block: bk});
          blocks.push(block);
          if (block.collides()) {
              blocks.end()
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
  input.downs.onValue(sendKey(0, 0, 1, 'downs'));
  input.lefts.onValue(sendKey(-1, 0, 0, 'lefts'));
  input.rights.onValue(sendKey(1, 0, 0, 'rights'));
  input.ts.onValue(sendKey(0, 1, 0, 'ts'));
  
  input.space.onValue(function() {
      block = block.down();
      send( {keyEvent: 'space' });
  });
  
  return { blocks: blocks, bus: bus };
};

var replayGameLogic = function(_, input, board) {

    return Bacon.update(
       undefined,
       [input.ups],    Block.move( 0, 0, 3),
       [input.downs],  Block.move( 0, 0, 1),
       [input.lefts],  Block.move(-1, 0, 0),
       [input.rights], Block.move( 1, 0, 0),
       [input.ts],     Block.move( 0, 1, 0),
       [input.space],  function(st) { return st.down(); },
       [input.block],  function(st, block) {
           return new BlockState(blocks[block], board);
       }
    ).filter(function(x) { return x !== undefined});
}

function tetris(drawing, input, makeBlock, gameL) {
  
  drawing.drawGameArea(w, h);

  var board = new Board(10, 20);
  
  var g = gameL(makeBlock, input, board)
  g.blocks.onValue(function (block) { 
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
