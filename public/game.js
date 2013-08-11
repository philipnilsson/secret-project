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
};

var gameLogic = function(input, board) {
  
  var bk = Block.randomBlock()
  var block = new BlockState(window.blocks[bk], board);
  var bus   = new Bacon.Bus()
  
  var paused = $(document).asEventStream('keydown').filter(function(ev) {
    return ev.keyCode == 80;
  }).scan(false, function(x) { return !x })
  
  input.filter(paused).takeWhile(bus).onValue(function (dir) {
    block = Block.moveDir(dir, block);
    bus.push({keyEvent: dir});
    if (block.isSet) {
      bus.push({res: board.set(block)});
      bk = Block.randomBlock();
      block = new BlockState(window.blocks[bk], board);
      bus.push({block: bk});
      if (block.collides()) 
        bus.endTS();
    }
  });
  
  return bus.toProperty({block: bk});
};

var replayGameLogic = function(bus, board) {
  var blocks = new Bacon.Bus();
  var block;
  bus.onValue(function(val) {
    if (val.keyEvent) {
      block = Block.moveDir(val.keyEvent, block);
      blocks.push({block: block});
    }
    else if (val.block) {
      block = new BlockState(window.blocks[val.block], board);
      blocks.push({block: block});
    }
    else if (val.res) {
      board.set(block)
      blocks.push({res: val.res});
    }
  });
  
  return blocks
};

function tetris(drawing, input, replay) {
  
  drawing.drawGameArea(w, h);

  if (!replay)
    bus = gameLogic(input, new Board(10, 20));
  else
    bus = input;
  var g = replayGameLogic(bus, new Board(10, 20));
  
  var score = 0;
  var block;
  g.onValue(function (event) {  
    if (event.block !== undefined) {
      block = event.block;
      drawing.drawBlock(block); 
    }
    if (event.res) { 
      var res = event.res;
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
  });
  
  g.onEnd(function() {
    drawing.drawGameOver();
    console.log('you dead');
  });
  
  return bus;
};
