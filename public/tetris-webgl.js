// Prints the M V P matrices
var printMVPOnce = false;
var DEBUG        = true;


 function Color() {
    this.WHITE = [1.0, 1.0, 1.0, 1.0];
    this.RED = [1.0, 0.0, 0.0, 1.0];
    this.GREEN = [0.0, 1.0, 0.0, 1.0];
    this.BLUE_SPECIAL = [0.0, 0.4, 1.0, 1.0];
    this.COLOR_SET = [1.0, 1.0, 0.0, 1.0];
}

/**
 * Object representing the OGL graphical element for a tetris block
 * @param gl
 * @constructor
 */
function GLSquare(gl) {
    var self = this;

    this.indexBuffer  = -1;
    this.vertexBuffer = -1;
    this.color = new Color().WHITE;

    this.matrixM = mat4.create();

    this.bind = function bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
    };

    this.getModelMatrix = function getModelMatrix(position, scale) {
        mat4.identity(self.matrixM);
        mat4.translate(self.matrixM, position);
        mat4.scale(self.matrixM, scale);

        return self.matrixM;
    }

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


    this.onStop = function(onStopCallback) {
        self.onStopCallback = onStopCallback;
        return self;
    };

    this.getAlpha = function getAlpha(){
        var alpha = 0;
        if(self.endTS && self.startTS) {
            alpha = (getCurrent() - self.startTS) / (self.duration);
        }

        return alpha;
    };

    this.doAnimateForever = function doAnimateForever() {
        self.animateForever = true;
        return self;
    }
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
    this.blocksKilled = [];

    function draw() {
        self.renderer.draw(self.blocksAlive.concat(self.blocksSet).concat(self.blocksKilled));
    }

    this.forceDraw = function forceDraw() {
        console.log("force draw");
        self.renderer.draw(self.blocksAlive.concat(self.blocksSet).concat(self.blocksKilled));
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
                if(!updatedBlocks[i].isDead) {
                    updatedBlocks[i].color = interpolate(new Color().RED, new Color().COLOR_SET, a);
                }
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
            block.color = new Color().RED;
            self.blocksAlive.push(block);
        } else {
            block.color = new Color().COLOR_SET;
            self.blocksSet.push(block);
        }

        return block;
    }

    /**
     * Updates the positions according to the rows that has been cleared
     * @param emptyRows
     */
    function updatePositions(emptyRows) {
        self.blocksSet.forEach(function (block) {
            block.y += emptyRows.filter(function (o) {
                return block.y <= o;
            }).length;
        });
    }

    this.clearRows = function clearRows(listOfRows) {
        if(DEBUG) console.log("clear rows: " + listOfRows);

        var kill = [];


        var blocksToSave = self.blocksSet.filter(function (block) {
            // animate block..
            var doSaveBlock = listOfRows.indexOf(block.y) == -1;

            if(!doSaveBlock) {
                kill.push(block);
            }

            return doSaveBlock;
        });

        if (self.blocksSet.length != blocksToSave.length) {
            self.blocksSet = blocksToSave;
        }

        if(kill) {
            // set initial conditions for every block
            for(var i=0; i<kill.length; i++) {
                var b = kill[i];
                b.isDead = true;
                b.z = -3;
                b.startY = kill[i].y;
                b.endY = 20;
                b.color = new Color().COLOR_SET;
                b.acc = Math.random() + 1;
            }

            new Animation()
                .onStop(function () {
                    self.blocksKilled = [];
                })
                .start(function (a) {
                    for (var i = 0; i < kill.length; i++) {
                        var b = kill[i];
                        // Use gravity isntead..
                        b.y = b.startY - a * (b.startY - b.endY) * b.acc;
                        b.x += Math.random()-0.5;
                        b.color[3] = Math.max(1 - a, 0);

                        // TODO add a little rotation as well..
                    }

                    self.blocksKilled = kill;

                    draw();
                });
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
            startColor : new Color().WHITE,
            endColor   : new Color().BLUE_SPECIAL
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


    // FIXME for testing

    this.addBlockAt = function addBlockAt(i, j) {
        console.log("add base block x:" + i + " j: " + j);
        addBaseBlock(shaderMap.TYPE_ANY_COLOR, i, j, true)

        draw();
    };
}

function BaseBlock(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.z = 0;
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
