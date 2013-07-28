function Drawing($game) {
    var board;

    this.drawGameArea = function drawGameArea(w, h) {
        var moo = '<canvas width="400" height="800" class="glCanvas">OMFG FAIL!</canvas>'
        $game.append(moo)
        
        var canvas = $game.find(".glCanvas").get(0);
        var gl = this.gl = canvas.getContext("webgl");

        board = new TetrisBoard(new WebGLRenderer(gl));

        board.init();
    };


    this.drawBlock = function drawBlock(st) {
        // TODO add function which takes the st directly
        var mat = [
            [1, 0, 0, 0, 1],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [1, 0, 0, 0, 1]
        ];

        for(var i=0; i<5; i++){
            for(var j=0; j<5; j++){
                if (st.block.get(i, j, st.rot)) {
                    mat[i][j] = 1;
                } else {
                    mat[i][j] = 0;
                }
            }
        }



        board.drawShapeAt(mat, null, st.x, st.y);
        board.draw();
    };

    this.setBlock = function setBlock(st, lines) {
        // TODO add function which takes the st directly
        var mat = [
            [1, 0, 0, 0, 1],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [1, 0, 0, 0, 1]
        ];

        for(var i=0; i<5; i++){
            for(var j=0; j<5; j++){
                if (st.block.get(i, j, st.rot)) {
                    mat[i][j] = 1;
                } else {
                    mat[i][j] = 0;
                }
            }
        }


        for(var i=0; i<lines.length; i++ ){
            lines[i] += i;
        }

        board.setBlock(mat, st.x, st.y)

        board.updatePositions(lines);

        board.draw();
    }
};
