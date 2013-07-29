function eq(x) {
  return function(y) { return x === y; };
}

function keyInputs() {
  var keys = $(document).asEventStream('keydown').map('.keyCode');
  return keys.flatMap(function(code) {
    switch(code) {
    case 38: return Bacon.once('up');
    case 37: return Bacon.once('left');
    case 39: return Bacon.once('right');
    case 40: return Bacon.once('down');
    case 32: return Bacon.once('space');
    }
    return Bacon.never();
  }).merge(Bacon.interval(200).map('ts'));
}

var gameLogic = function(input, board) {
  
  var bk = Block.randomBlock()
  var block = new BlockState(window.blocks[bk], board);
  var bus   = new Bacon.Bus()
  
  input.takeWhile(bus).onValue(function (dir) {
    block = Block.moveDir(dir, block);
    bus.push({keyEvent: dir});
    if (block.isSet) {
      board.set(block);
      bk = Block.randomBlock();
      block = new BlockState(window.blocks[bk], board);
      bus.push({block: bk});
      if (block.collides()) 
        bus.end();
    }
  });
  
  return bus.toProperty({block: bk});
};

var replayGameLogic = function(bus, board) {
  var blocks = new Bacon.Bus();
  var block;
  bus.onValue(function(val) {
    if (val.keyEvent)
      block = Block.moveDir(val.keyEvent, block);
    else if (val.block) 
      block = new BlockState(window.blocks[val.block], board);
    if (block.isSet)
      block.res = board.set(block);
    blocks.push(block);
  });
  
  return blocks
}

function tetris(drawing, input, replay) {
  
  drawing.drawGameArea(w, h);

  if (!replay)
    bus = gameLogic(input, new Board(10, 20));
  else
    bus = input;
  var g = replayGameLogic(bus, new Board(10, 20));
  
  var score = 0;
  g.onValue(function (block) { 
    if (block.res) { 
      var res = block.res;
      score += res.lines.length;
      drawing.drawScore(score);
      drawing.setBlock(block, res.lines);
      if (res.special.length) {
        for (var i in res.special)
          drawing.drawSpecial(res.special[i]);
      }
      if (res.powerups.length > 0) {
        drawing.addPowerUps(res.powerups);
      }
    }
    drawing.drawBlock(block); 
  });
  
  g.onEnd(function() {
    console.log('you dead');
  })
  
  return bus;
};
