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
 
  return makeBlock().flatMap(function(block) {
    var init = new BlockState(block, board);
  
    if (init.collides()) {
      init.isSet = true;
      return Bacon.once(init);
    }

    var block = Bacon.update(
       init,
       [input.ups],    Block.move( 0, 0, 3),
       [input.downs],  Block.move( 0, 0, 1),
       [input.lefts],  Block.move(-1, 0, 0),
       [input.rights], Block.move( 1, 0, 0),
       [input.ts],     Block.move( 0, 1, 0),
       [input.space],  function(st) { return st.down(); }
    );

    return block
      .takeUntil(function(x) { return x.isSet; })
      .flatMapEnd(function () { return gameLogic(makeBlock, input, board) } );
  });
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
  var blockList = new Bacon.Bus()
  
  
  var g = gameL(makeBlock, input, board)
  g.onValue(function (block) { 
    if (block.isSet) 
      drawing.setBlock(block, board.set(block));
    drawing.drawBlock(block); 
  });
  
  g.onEnd(function() {
    console.log('you dead');
  })
  
  if (makeBlock)
      return makeBlock.bus;
};
