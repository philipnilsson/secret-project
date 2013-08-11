
function Drawing($game) {

    var self = this;
    
    function makeRow(i) {
        var row = $('<div/>').addClass('row');
        for (var j = 0; j < w; j++) 
            row.append($('<div/>').addClass('cell'));
        return row;
    }  

    this.addPowerUps = function addPowerUps(powerups) {
      for (var i in powerups) {
        self.$powerups.append('<div class="powerup">' + powerups[i] + '</div>');
      }
    }

    this.drawGameArea = function drawGameArea(w, h) {
        self.$score = $('<div class="score"> 0 </div>')
        self.$powerups = $('<div class="powerups"> </div>')
        self.$rows = $('<div class="rows"> </div>')
        $game.append(self.$score)
        $game.append(self.$rows)
        $game.append(self.$powerups)
        for (var i = 0; i < h; i++) {
            self.$rows.append(makeRow(i));
        }
    };

    function setBlockClass(st, klass) {
        for (var i = 0; i < 5; i++)
            for (var j = 0; j < 5; j++) {
                if(st.block.get(i, j, st.rot))
                    self.$rows.find('.row').eq(i + st.y).find('.cell').eq(j + st.x).addClass(klass);
            }
    }

    this.drawBlock = function drawBlock(st) {
        self.$rows.find('.cell').removeClass('active');
        setBlockClass(st, 'active');
    };

    this.setBlock = function setBlock(st, lines) {
        setBlockClass(st, 'set');
        var n = lines.length;
        for (var i = 0; i < n; i++) 
            self.$rows.find('.row').eq(lines[i]).remove();
        for (i = 0; i < n; i++)
            self.$rows.prepend(makeRow(0));
    };
    
    this.drawScore = function drawScore(score) {
      self.$score.html(score)
    };
  
    this.drawSpecial = function drawSpecial(res) {
      self.$rows.find('.row').eq(res.i).find('.cell').eq(res.j).addClass('special');
    };

    this.drawGameOver = function drawGameOver() {
        // TODO månkey
    }
}
