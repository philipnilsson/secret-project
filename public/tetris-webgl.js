// Prints the M V P matrices
var printOnce = false;

function GLSquare(gl) {
    var self = this;

    this.indexBuffer  = -1;
    this.vertexBuffer = -1;
    this.color = [1, 1, 1, 1]


    this.bind = function bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
    }

    this.draw = function draw() {
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}

function TetrisBoard(renderer) {
    var self = this;
    this.renderer = renderer;

    var shaderMap = {
        TYPE_DEFAULT : createDefaultShader(renderer.gl), //Normal piece
        TYPE_SET     : createSetShader(renderer.gl),
        TYPE_ANY_COLOR     : createColorShader(renderer.gl),
    }

    // TODO create a pool of live blocks and re-use them
    this.liveBlocks = [];

    this.setBlocks = [];

    this.init = function init() {
        self.draw();
    }

    this.draw = function draw() {
        // console.log('draw')
        var allBlocks = self.liveBlocks.concat(self.setBlocks)
        self.renderer.draw(allBlocks);

    }

    // Intervadl of 15 ms ~60fps
    this.renderWithInterval = function renderWithInterval(interval) {
        if(interval == undefined) interval = 15;
        setInterval(self.draw, interval);
    }

    var animationId;

    function startAnimation(block, toColor) {
        var start = new Date().getTime();
        // time as parameter
        var end = start + 500;
        var startColor = block.color;
        var endColor = toColor;

        animationId = setInterval( function() { animateFoundBlock(block, start, end, startColor, endColor); }, 15);   
    }

    function animateFoundBlock(block, start, end, startColor, endColor) {
        var current = new Date().getTime();

        var ds = (current - end) / (end - start);
        ds += 1;

        //console.log("ds: " + ds);

        if(current < end) {
            block.color[0] = startColor[0] + ds * (endColor[0] - startColor[0]);
            block.color[1] = startColor[1] + ds * (endColor[1] - startColor[1]);
            block.color[2] = startColor[2] + ds * (endColor[2] - startColor[2]);

            self.draw();
        } else {
            block.color = endColor;

            clearInterval(animationId);

            //console.log("animation stop");

        }
    }


    this.setBlock = function setBlock(matrix, x, y) {
        self.liveBlocks = [];

        var len = matrix.length;

        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len; j++) {
                if (matrix[j][i]) {
                    self.addTetrisBaseElement(shaderMap.TYPE_ANY_COLOR, x + i, y + j, false);
                }
            }
        }
    }

    this.addTetrisBaseElement = function addTetrisBaseElement(type, x, y, alive) {
        var rect = new TetrisBaseElement(type, x, y);

        if (alive) {
            self.liveBlocks.push(rect);
            rect.color = [0.5, 0.0, 0.0, 1.0];
        } else {
            self.setBlocks.push(rect);
            rect.color = [0.5, 0.5, 0.0, 1.0];
        }

        return rect;
    }

    this.clearRows = function clearRows(listOfRows) {
        //console.log("rows to clear: " + listOfRows)


        // caclulate which blocks not to remove
        var blocksToSave = this.setBlocks.filter(function (tetrisElement) {
            return listOfRows.indexOf(tetrisElement.y) == -1
        });

        if (this.setBlocks.length != blocksToSave.length) {
            this.setBlocks = blocksToSave;
        }
    }

    this.updatePositions = function (emptyrows) {
        self.clearRows(emptyrows);

        //shift all pieces above one step down
        this.setBlocks.forEach(function (piece) {
            var nYShifts = emptyrows.filter(function (o) {
                return piece.y <= o;
            }).length;
            piece.y += nYShifts;

        })
    };

    this.clear = function clear() {
        if (this.livePiece) {
            this.killLivePiece();
        }
        this.liveBlocks = []
    }

    this.drawShapeAt = function drawShapeAt(matrix, type, x, y) {

        self.liveBlocks = []

        var len = matrix.length;

        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len; j++) {
                if (matrix[j][i]) {
                    self.addTetrisBaseElement(shaderMap.TYPE_ANY_COLOR, x + i, y + j, true)
                }
            }
        }
    }

    this.updateBlock = function updateBlock(x, y) {
        //console.log("update block x: " +  x + " y: " + y);

        var foundBlock = undefined;

        for(var i=0; i<self.setBlocks.length; i++) {
            var block = self.setBlocks[i];
            if(block.x == x && block.y == y) {
                foundBlock = block;
                break;
            }
        }
        console.log(foundBlock);
        startAnimation(foundBlock, [0, 0, 0.8, 1]);
    }

    

    function TetrisBaseElement(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.alive = true;


        this.kill = function kill() {
            this.alive = false;
        }

        this.resurrect = function resurrect() {
            this.alive = true;
        }

        //takes alive state into consideration
        // only alive objects can be moved with this function.
        this.move = function move(dx, dy) {
            if (this.alive) {
                this.forceMove(dx, dy);
            }
        }

        //Disregards alive state
        this.forceMove = function forceMove(dx, dy) {
            this.x -= dx;
            this.y -= dy;
        }
    }


}


// Shaders ============================================================================================

function createDefaultShader(gl) {

    // Now figure out what type of shader script we have,
    // based on its MIME type.
    var srcFS = getShaderSrc("shader-fs");
    var srcVS = getShaderSrc("shader-vs");

    var sf = new ShaderFactory(gl);
    var shader = sf.makeShader(srcVS, srcFS);

    gl.useProgram(shader.program);

    shader.handleVertexPosition = gl.getAttribLocation(shader.program, "aVertexPosition");
    shader.handleMVP = gl.getUniformLocation(shader.program, "uMVP");

    gl.enableVertexAttribArray(shader.handleVertexPosition);

    return shader;

};

function createSetShader(gl) {

    // Now figure out what type of shader script we have,
    // based on its MIME type.
    var srcFS = getShaderSrc("shader-fs-set");
    var srcVS = getShaderSrc("shader-vs");

    var sf = new ShaderFactory(gl);
    var shader = sf.makeShader(srcVS, srcFS);

    gl.useProgram(shader.program);

    shader.handleVertexPosition = gl.getAttribLocation(shader.program, "aVertexPosition");
    shader.handleMVP = gl.getUniformLocation(shader.program, "uMVP");

    gl.enableVertexAttribArray(shader.handleVertexPosition);

    return shader;

};

function createColorShader(gl) {
    // Now figure out what type of shader script we have,
    // based on its MIME type.
    var srcFS = getShaderSrc("shader-fs-any-color");
    var srcVS = getShaderSrc("shader-vs");

    var sf = new ShaderFactory(gl);
    var shader = sf.makeShader(srcVS, srcFS);

    gl.useProgram(shader.program);

    shader.handleVertexPosition = gl.getAttribLocation(shader.program, "aVertexPosition");
    shader.handleMVP = gl.getUniformLocation(shader.program, "uMVP");
    shader.handleBlockColor = gl.getUniformLocation(shader.program, "uBlockColor");

    gl.enableVertexAttribArray(shader.handleVertexPosition);

    return shader;

};



// Helper functions ===================================================================================

function getShaderSrc(id, type) {
    var shaderScript = document.getElementById(id);

    // Didn't find an element with the specified ID; abort.
    if (!shaderScript) {
        return null;
    }

    // Walk through the source element's children, building the
    // shader source string.

    var theSource = "";
    var currentChild = shaderScript.firstChild;

    while (currentChild) {
        if (currentChild.nodeType == 3) {
            theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }

    return theSource
}

function printMat4(matrix) {
    var str = "";
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            str += matrix[i * 4 + j] + " ";
        }
        str += "\n"
    }

    return str;
}

function printMat5(matrix) {
    var str = "";
    for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {
            str += matrix[i * 4 + j] + " ";
        }
        str += "\n"
    }

    return str;
}

function printMVP(matrixM, matrixV, matrixP, matrixMVP) {
    console.log("M");
    printMat4(matrixM);

    console.log("V");
    printMat4(matrixV);

    console.log("P");
    printMat4(matrixP);


    console.log("MVP");
    printMat4(matrixMVP);
}
