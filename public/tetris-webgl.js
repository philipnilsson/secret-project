// Prints the M V P matrices
var printOnce = false;

/**
 *  |-----|
 *  |     |  <===== Tetris Shape
 *  |-----|
 *  |-----||-----|
 *  |     |      |
 *  |-----||-----|
 *  |-----|
 *  |     |
 *  |-----|
 *
 *
 *  |-----|
 *  |     |  <===== Tetris Block
 *  |-----|
 *
 */



/**
 * Object representing the OGL graphical element for a tetris block
 * @param gl
 * @constructor
 */
function GLSquare(gl) {
    var self = this;

    this.indexBuffer = -1;
    this.vertexBuffer = -1;
    this.color = [1, 1, 1, 1];


    this.bind = function bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
    };

    this.draw = function draw() {
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
}

/**
 * Linear interpolation between two vectors {@link v1} and {@link v2}.
 *
 * @param v1 The first vector
 * @param v2 The second vector
 * @param alpha The amount
 * @returns {Array} An interpolated vector of {@link v1} and {@link v2} by {@link alpha}
 */
function interpolate(v1, v2, alpha) {
    var res = [];
    for (var i = 0; i < v1.length; i++)
        res.push(v1[i] - alpha * (v1[i] - v2[i]));
    return res;
}

function TetrisBoard(renderer) {
    var self = this;
    this.renderer = renderer;

    var shaderMap = {
        TYPE_ANY_COLOR: createColorShader(renderer.gl)
    };

    // TODO create a pool of live blocks and re-use them
    this.blocksAlive = [];

    this.blocksSet = [];

    this.init = function init() {
        self.draw();
    };

    this.draw = function draw() {
        // console.log('draw')
        var allBlocks = self.blocksAlive.concat(self.blocksSet);
        self.renderer.draw(allBlocks);

    };

    /**
     * Animates the color of a block from the set
     * color to the {@link toColor}
     *
     * @param block The block who is being aniamted
     * @param toColor The color we should animate to
     * @param duration The duration of the animation
     */
    function startAnimation(block, toColor, duration) {
        var start = new Date().getTime();
        // time as parameter
        var end = start + duration;

        var animation = new animateFoundBlock(block, start, end, block.color, toColor);
        animation.animationId = setInterval(animation.animate, 15);
    }
    // TODO create animation class

    function animateFoundBlock(block, start, end, startColor, endColor) {
        var anim = this;
        var totalTime = end - start;
        this.animate = function () {

            var current = new Date().getTime();
            var ds = (current - start) / totalTime;

            if (current < end) {
                block.color = interpolate(startColor, endColor, ds);
                self.draw();
            } else {
                block.color = endColor;
                clearInterval(anim.animationId);
            }
        }
    }

    // FIXME Deprecated
    this.setBlock = function setBlock(matrix, x, y) {
        self.blocksAlive = [];

        var len = matrix.length;

        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len; j++) {
                if (matrix[j][i]) {
                    self.addTetrisBaseElement(shaderMap.TYPE_ANY_COLOR, x + i, y + j, false);
                }
            }
        }
    };

    this.setBlock = function setBlock(st) {
        self.blocksAlive = [];

        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 5; j++) {
                if (st.block.get(j, i, st.rot)) {
                    self.addTetrisBaseElement(shaderMap.TYPE_ANY_COLOR, st.x + i, st.y + j, false);
                }
            }
        }
    };

    this.addTetrisBaseElement = function addTetrisBaseElement(type, x, y, alive) {
        var rect = new TetrisBaseElement(type, x, y);

        if (alive) {
            self.blocksAlive.push(rect);
            // TODO decide color by type instead..
            rect.color = [0.5, 0.0, 0.0, 1.0];
        } else {
            self.blocksSet.push(rect);
            rect.color = [0.5, 0.5, 0.0, 1.0];
        }

        return rect;
    };

    this.clearRows = function clearRows(listOfRows) {
        console.log("clear rows: " + listOfRows);



        var blocksToSave = this.blocksSet.filter(function (tetrisElement) {
            return listOfRows.indexOf(tetrisElement.y) == -1
        });

        if (this.blocksSet.length != blocksToSave.length) {
            this.blocksSet = blocksToSave;
        }
    };

    this.updatePositions = function (emptyrows) {
        self.clearRows(emptyrows);

        this.blocksSet.forEach(function (piece) {
            piece.y += emptyrows.filter(function (o) {
                return piece.y <= o;
            }).length;
        });
    };

    // FIXME Deprecated
    this.drawShapeAt = function drawShapeAt(matrix, type, x, y) {
        self.blocksAlive = [];

        var len = matrix.length;

        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len; j++) {
                if (matrix[j][i]) {
                    // TODO use the actual type..
                    self.addTetrisBaseElement(shaderMap.TYPE_ANY_COLOR, x + i, y + j, true)
                }
            }
        }
    };

    this.drawShapeAt = function drawShapeAt(st) {
        self.blocksAlive = [];

        var len = 5;

        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len; j++) {
                if (st.block.get(j, i, st.rot)) {
                    self.addTetrisBaseElement(shaderMap.TYPE_ANY_COLOR, st.x + i, st.y + j, true)
                }
            }
        }
    };


    this.updateBlock = function updateBlock(x, y) {
        var foundBlock = undefined;

        for (var i = 0; i < self.blocksSet.length; i++) {
            var block = self.blocksSet[i];
            if (block.x == x && block.y == y) {
                foundBlock = block;
                break;
            }
        }

        if (foundBlock) {
            startAnimation(foundBlock, [0, 0, 0.8, 1], 1000);
        } else {
            console.log("Found no block to update; x: " + x + " y: " + y);
        }

    };
}

function TetrisBaseElement(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.alive = true;


    this.kill = function kill() {
        this.alive = false;
    };

    this.resurrect = function resurrect() {
        this.alive = true;
    };

    //takes alive state into consideration
    // only alive objects can be moved with this function.
    this.move = function move(dx, dy) {
        if (this.alive) {
            this.forceMove(dx, dy);
        }
    };

    //Disregards alive state
    this.forceMove = function forceMove(dx, dy) {
        this.x -= dx;
        this.y -= dy;
    };
}

// Shaders ============================================================================================

function createColorShader(gl) {
    // Now figure out what type of shader script we have,
    // based on its MIME type.
    var srcFS = getShaderSrc("shader-fs-any-color");
    var srcVS = getShaderSrc("shader-vs");

    var sf = new ShaderFactory(gl);
    var shader = sf.makeShader(srcVS, srcFS);

    gl.useProgram(shader.program);

    shader.bindQualifiers(gl);

    if (!shader.verify()) {
        alert("Failed binding qualifiers for color shader");
    }

    return shader;
}


// Helper functions ===================================================================================

function getShaderSrc(id) {
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

/**
 * Requires the matrix to be on the form NxN
 * @param matrix The matrix
 * @returns {string}
 */
function matrixToString(matrix) {
    var dim = Math.sqrt(matrix.length);

    var str = "";
    for (var i = 0; i < dim; i++) {
        for (var j = 0; j < dim; j++) {
            str += matrix[i * dim + j] + " ";
        }
        str += "\n"
    }

    return str;
}

function printMVP(matrixM, matrixV, matrixP, matrixMVP) {
    console.log("M");
    matrixToString(matrixM);

    console.log("V");
    matrixToString(matrixV);

    console.log("P");
    matrixToString(matrixP);

    console.log("MVP");
    matrixToString(matrixMVP);
}
