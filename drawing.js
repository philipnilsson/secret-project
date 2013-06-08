function makeRow(i) {
  var row = $('<div/>').addClass('row');
    for (var j = 0; j < w; j++) 
      row.append($('<div/>').addClass('cell'));
  return row;
}  

function drawGameArea(w, h) {
  var game = $('#game');
  for (var i = 0; i < h; i++) {
    game.append(makeRow(i));
  }
}

function setBlockClass(st, klass) {
  for (var i = 0; i < 5; i++)
  for (var j = 0; j < 5; j++) {
    if(st.block.get(i, j, st.rot))
      $('.row').eq(i + st.y).find('.cell')
          .eq(j + st.x).addClass(klass);
  }
}

function drawBlock(st) {
  $('.cell').removeClass('active');
  setBlockClass(st, 'active');
}

function setBlock(st, lines) {
  setBlockClass(st, 'set');
  var n = lines.length;
  for (var i = 0; i < n; i++) 
    $('.row').eq(lines[i]).remove()
  for (var i = 0; i < n; i++)
    $('#game').prepend(makeRow(0));
}
