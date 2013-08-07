function Drawing($game) {
    var self = this;
    this.board = undefined;
    this.canvas = undefined;
    this.mode = undefined;

    this.drawGameArea = function drawGameArea(w, h) {
        var canvasTag = '<canvas width="400" height="800" class="glCanvas" onclick="canvasClicked()" style="border:1px solid #000000;background: black">OMFG FAIL!</canvas>'
        $game.append(canvasTag)

        self.canvas = $game.find(".glCanvas").get(0);
//        var gl = this.gl = canvas.getContext("webgl");

        var gl = self.canvas.getContext(
            "experimental-webgl",
            {
                premultipliedAlpha: false  // Ask non-premultiplied alpha
            }
        );
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

    this.drawScore = function drawScore(score) {
        // TODO
    };

    this.generateRandomBlocks = function generateRandomBlocks() {
        var nBlocks = 20;


        for(var i=0; i<nBlocks; i++) {
//            var bs = new BlockState(Block.randomBlock(), undefined, 0, Math.round(Math.random()*10), Math.round(Math.random()*20), true);
            var bk = Block.randomBlock()
            var block = new BlockState(window.blocks[bk], undefined, 0, Math.round(Math.random()*10), Math.round(Math.random()*20), true);
            self.setBlock(block);
        }


        console.log("TODO gen random blocks");
    }

    this.forceDraw = function forceDraw() {
        self.board.forceDraw();
    }
}
