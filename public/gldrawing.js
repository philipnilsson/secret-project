function Drawing($game) {
    var self = this;
    var usePremultipliedAlpha = false;

    this.board = undefined;
    this.canvas = undefined;

    this.drawGameArea = function drawGameArea(w, h) {
        var canvasTag = '<canvas width="400" height="800" class="glCanvas" onclick="canvasClicked()">WebGL fails you so bad it hurts</canvas>'
        $game.append(canvasTag)

        self.canvas = $game.find(".glCanvas").get(0);
        var gl  = usePremultipliedAlpha
            ? self.canvas.getContext("webgl")
            : self.canvas.getContext( "experimental-webgl", { premultipliedAlpha: false  });

        var renderer = new WebGLRenderer(gl);

        self.board = new TetrisBoard(renderer);
        self.board.init();
    };


    this.drawBlock = function drawBlock(st) {
        self.board.drawBlock(st);
    };

    this.setBlock = function setBlock(st, lines) {
        self.board.setBlock(st);

        if(lines) {
            for(var i=0; i<lines.length; i++) {
                lines[i] += i;
            }

            self.board.clearRows(lines);
        }
    };

    this.drawSpecial = function drawSpecial(res) {
        self.board.setSpecialBlock(res.j, res.i);
    };

    // Scoreboard related
    this.addPowerUps = function addPowerUps(powerups) {
        //console.log("power ups: " + powerups);
        // TODO
    };


    this.drawGameOver = function drawGameOver() {

    };

    this.drawScore = function drawScore(score) {
        // TODO
    };

    this.generateRandomBlocks = function generateRandomBlocks() {
        var nBlocks = 20;

        // TODO make sure no duplicates??
        for(var i=0; i<nBlocks; i++) {
            self.board.addBlockAt(Math.round(Math.random()*10), Math.round(Math.random()*20));
        }


        console.log("TODO gen random blocks");
    };

    this.fillBlocks = function fillBlocks() {
        for(var i=0; i<10; i++) {
            for(var j=0; j<20; j++) {
                self.board.addBlockAt(i, j);

            }
        }
    };

    this.forceDraw = function forceDraw() {
        self.board.forceDraw();
    };
}
