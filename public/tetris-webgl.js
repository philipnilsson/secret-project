// Prints the M V P matrices
var printMVPOnce = false;
var DEBUG        = true;


var Color = {
    WHITE        : [1.0, 1.0, 1.0, 1.0],
    RED          : [1.0, 0.0, 0.0, 1.0],
    BLUE_SPECIAL : [0.0, 0.2, 1.0, 1.0],
    COLOR_SET    : [1.0, 1.0, 0.0, 1.0]

};

/**
 * Object representing the OGL graphical element for a tetris block
 * @param gl
 * @constructor
 */
function GLSquare(gl) {
    var self = this;

    this.indexBuffer  = -1;
    this.vertexBuffer = -1;
    this.color = Color.WHITE;

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

/**
 * @param duration The duratiom, default is 250 ms
 * @param updateRate The update rate, the default is 15 ms
 * @constructor
 */
function Animation(duration, updateRate) {
    var self = this;

    this.animationId = undefined;

    // Default duration of 250ms
    this.duration   = duration   == undefined ? 250 : duration;
    this.updateRate = updateRate == undefined ? 15  : updateRate;

    this.startTS = undefined;
    this.endTS   = undefined;

    // Callbacks
    this.onStopCallback = undefined;
    this.onAnimateCallback = undefined;
    this.animateForever = false;

    function getCurrent() {
        return new Date().getTime();
    }

    function animateThis() {
        // If we are not animating forever stop after end time has been passed
        if(!self.animateForever && getCurrent() >= self.endTS ){
            self.stop();
        }

        if(self.onAnimateCallback) {
            self.onAnimateCallback(self.getAlpha());
        }
    }

    this.start = function start(onAnimateCallback){
        if(DEBUG) if(DEBUG) console.log("start animation");

        self.startTS = getCurrent();
        self.endTS = self.startTS + self.duration;
        self.onAnimateCallback = onAnimateCallback;
        self.animationId = setInterval(animateThis, self.updateRate);
    };

    this.stop = function stop() {
        if(self.animationId) {
            clearInterval(self.animationId);

            if(self.onStopCallback) {
                self.onStopCallback();
            }
        }
    };


    this.setOnStop = function(onStopCallback) {
        self.onStopCallback = onStopCallback;
    };

    this.getAlpha = function getAlpha(){
        var alpha = 0;
        if(self.endTS && self.startTS) {
            alpha = (getCurrent() - self.startTS) / (self.duration);
        }

        return alpha;
    };
}

function TetrisBoard(renderer) {
    var self = this;
    this.renderer = renderer;

    var shaderMap = {
        TYPE_ANY_COLOR: createColorShader(renderer.gl)
    };

    // TODO create a pool of live blocks and re-use them
    this.blocksAlive = [];
    this.blocksSet   = [];

    function draw() {
        self.renderer.draw(self.blocksAlive.concat(self.blocksSet));
    }

    this.init = function init() {
        draw();
    };

    /**
     * Set block from alive to set
     *
     * @param st
     */
    this.setBlock = function setBlock(st) {
        self.blocksAlive = [];

        var updatedBlocks = []
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 5; j++) {
                if (st.block.get(j, i, st.rot)) {
                    var block  = addBaseBlock(shaderMap.TYPE_ANY_COLOR, st.x + i, st.y + j, false);
                    updatedBlocks.push(block);
                }
            }
        }
        new Animation(100).start(function(a) {
            for(var i=0; i<updatedBlocks.length; i++){
                updatedBlocks[i].color = interpolate(Color.RED, Color.COLOR_SET, a);
            }
            draw();
        });
    };

    /**
     * Adds a tetris base block to the stack of blocks
     *
     * @param type The type of block
     * @param x The x-coordinate
     * @param y The y-coordinate
     * @param alive If the block is alive
     * @returns {BaseBlock}
     */
    function addBaseBlock(type, x, y, alive) {
        var block = new BaseBlock(type, x, y);

        if (alive) {
            // TODO decide color by type instead..
            block.color = Color.RED;
            self.blocksAlive.push(block);
        } else {
            block.color = Color.COLOR_SET;
            self.blocksSet.push(block);
        }

        return block;
    }

    function updatePositions(emptyRows) {
        self.blocksSet.forEach(function (block) {
            block.y += emptyRows.filter(function (o) {
                return block.y <= o;
            }).length;
        });
    }

    this.clearRows = function clearRows(listOfRows) {
        if(DEBUG) console.log("clear rows: " + listOfRows);

        var blocksToSave = self.blocksSet.filter(function (tetrisElement) {
            return listOfRows.indexOf(tetrisElement.y) == -1
        });

        if (self.blocksSet.length != blocksToSave.length) {
            self.blocksSet = blocksToSave;
        }

        updatePositions(listOfRows);
        draw();
    };

    this.drawBlock = function drawBlock(st) {
        self.blocksAlive = [];

        // Max dimension of array
        var len = 5;

        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len; j++) {
                if (st.block.get(j, i, st.rot)) {
                    addBaseBlock(shaderMap.TYPE_ANY_COLOR, st.x + i, st.y + j, true)
                }
            }
        }

        draw();
    };


    /**
     * Sets block at position to a special block.
     * @param x The x-coordinate
     * @param y The y-coordinate
     */
    this.setSpecialBlock = function setSpecialBlock(x, y) {
        // Animation properties
        var prop = {
            block : undefined,
            duration   : 250,
            startColor : Color.WHITE,
            endColor   : Color.BLUE_SPECIAL
        };

        for (var i = 0; i < self.blocksSet.length; i++) {
            var block = self.blocksSet[i];
            if (block.x == x && block.y == y) {
                prop.block = block;
                break;
            }
        }

        if (prop.block) {
            new Animation(prop.duration).start(function(alpha){
                prop.block.color = interpolate(prop.startColor, prop.endColor, alpha);
                draw();
            });

        } else {
            if(DEBUG) console.log("Found no block to update; x: " + x + " y: " + y);
        }

    };
}

function BaseBlock(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
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
    if(DEBUG){
        console.log("M");
        console.log(matrixToString(matrixM));

        console.log("V");
        console.log(matrixToString(matrixV));

        console.log("P");
        console.log(matrixToString(matrixP));

        console.log("MVP");
        console.log(matrixToString(matrixMVP));
    }
}
