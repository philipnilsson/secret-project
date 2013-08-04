function Drawing($game) {
    var board;

    this.drawGameArea = function drawGameArea(w, h) {
        var moo = '<canvas width="400" height="800" class="glCanvas">OMFG FAIL!</canvas>'
        $game.append(moo)
        
        var canvas = $game.find(".glCanvas").get(0);
        var gl = this.gl = canvas.getContext("webgl");
        var renderer = new WebGLRenderer(gl);

        board = new TetrisBoard(renderer);
        board.init();
    };


    this.drawBlock = function drawBlock(st) {
        board.drawBlock(st);
    };

    this.setBlock = function setBlock(st, lines) {
        board.setBlock(st);

        if(lines) {
            for(var i=0; i<lines.length; i++) {
                lines[i] += i;
            }

            board.clearRows(lines);
        }
    };

    this.drawSpecial = function drawSpecial(res) {
        board.setSpecialBlock(res.j, res.i);
    };


    // Scoreboard related
    this.addPowerUps = function addPowerUps(powerups) {
        //console.log("power ups: " + powerups);
        // TODO
    };

    this.drawScore = function drawScore(score) {
        // TODO
    };
}
