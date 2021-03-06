// Prints the M V P matrices
var printMVPOnce = false;
var DEBUG        = true;


 function Color() {
    this.WHITE = [1.0, 1.0, 1.0, 1.0];
    this.RED = [1.0, 0.0, 0.0, 1.0];
    this.GREEN = [0.0, 1.0, 0.0, 1.0];
    this.BLUE_SPECIAL = [0.0, 0.4, 1.0, 1.0];
    this.COLOR_SET = [1.0, 1.0, 0.0, 1.0];
    this.BACKGROUND = [0.12, 0.12, 0.12, 1.0];
}

/**
 * Object representing the OGL graphical element for a tetris block
 * @param gl
 * @constructor
 */
function SquareModel(gl) {
    var self = this;

    this.indexBuffer  = -1;
    this.vertexBuffer = -1;
    this.color = new Color().WHITE;

    this.matrixM = mat4.create();

    this.bind = function bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
    };

    this.getModelMatrix = function getModelMatrix(position, scale, rotation) {
        mat4.identity(self.matrixM);

        if(position) mat4.translate(self.matrixM, position);

        if(rotation){
            var rotX = rotation[0];
            var rotY = rotation[1];
            var rotZ = rotation[2];

            // Center square model.
            mat4.translate(self.matrixM, [0.5, 0.5, 0]);

            if(rotX) mat4.rotateX(self.matrixM, rotX);
            if(rotY) mat4.rotateY(self.matrixM, rotY);
            if(rotZ) mat4.rotateZ(self.matrixM, rotZ);

            mat4.translate(self.matrixM, [-0.5, -0.5, 0]);
        }

        if(scale) mat4.scale(self.matrixM, scale);


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
 * @param duration The duration, default is 250 ms
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

        return self;
    };

    this.stop = function stop() {
        if(self.animationId) {
            clearInterval(self.animationId);

            if(self.onStopCallback) {
                self.onStopCallback();
            }
        }

        return self;
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

    var blocksAlive = [];
    var blocksSet   = [];
    var blocksBeingKilled = [];

    var bgBlocks = new Array(10);

    function getAllBlocks() {
        return blocksAlive.concat(blocksSet.concat(blocksBeingKilled));
    }

    function draw() {
        self.renderer.draw(getAllBlocks(), bgBlocks);
    }

    this.forceDraw = function forceDraw() {
        console.log("force draw");
        draw();
    }

    this.init = function init() {
        console.log("init gl renderer");
        // create bg blocks

        for(var x=0; x<10; x++) {
            bgBlocks[x] = new Array(20);
            for(var y=0; y<20; y++) {
                bgBlocks[x][y] = new BaseBlock(shaderMap.TYPE_ANY_COLOR, x, y);
                bgBlocks[x][y].color = new Color().BACKGROUND;
                bgBlocks[x][y].z = -1;
            }
        }

        // clears the board..
        draw();
    };

    /**
     * Set block from alive to set
     *
     * @param st
     */
    this.setBlock = function setBlock(st) {
        blocksAlive = [];
        var updatedBlocks = [];
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 5; j++) {
                if (st.block.get(j, i, st.rot)) {
                    var block  = addBaseBlock(shaderMap.TYPE_ANY_COLOR, st.x + i, st.y + j, false);
                    updatedBlocks.push(block);
                }
            }
        }

        var setAnimatiomn = new Animation(100).start(function(a) {
            updatedBlocks.forEach(function(b) {
                b.animation = setAnimatiomn;
                b.color = interpolate(new Color().RED, new Color().COLOR_SET, a);
            });
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
            blocksAlive.push(block);
        } else {
            block.color = new Color().COLOR_SET;
            blocksSet.push(block);
        }

        return block;
    }

    /**
     * Updates the positions according to the rows that has been cleared
     * @param emptyRows
     */
    function updatePositions(emptyRows) {
        blocksSet.forEach(function (block) {
            // TODO Animate this instead?
            block.y += emptyRows.filter(function (o) {
                return block.y <= o;
            }).length;
        });
    }

    this.clearRows = function clearRows(listOfRows, clearRowFunction) {
        if(DEBUG) console.log("clear rows: " + listOfRows);

        var blockBeingAnimated = [];

        var blocksToSave = blocksSet.filter(function (block) {
            // animate block..
            var doSaveBlock = listOfRows.indexOf(block.y) == -1;

            if(!doSaveBlock) {
                blockBeingAnimated.push(block);
            }

            return doSaveBlock;
        });

        if(DEBUG) console.log("blocks to save: " + blocksToSave.length);
        if(DEBUG) console.log("blocks to kill: " + blockBeingAnimated.length);

        if (blocksSet.length != blocksToSave.length) {
            blocksSet = blocksToSave;
        }

        if (blockBeingAnimated) {
            if(clearRowFunction) {
                if(clearRowFunction == "explosion") {
                    explosionAnimation(blockBeingAnimated);
                }
            } else {
                gravityAnimation(blockBeingAnimated);
            }
        }

        updatePositions(listOfRows);
        draw();
    };

    this.drawBlock = function drawBlock(st) {
        blocksAlive = [];

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

        for (var i = 0; i < blocksSet.length; i++) {
            var block = blocksSet[i];
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

    /**
     * Animates blocks falling as if gravity were pulling them down.
     * @param blocks
     */
    function gravityAnimation(blocks) {
        // initial animation conditions for each block
        blocks.forEach(function (b) {
            // Kill and remove any current animations
            if (b.animation) {
                b.animation.stop();
                b.animation = undefined;
            }
            b.z = 0.5; // move blocks above others
            b.startY = b.y;
            b.startVy = 0;
            b.acc = Math.random() + 1;
        });

        new Animation()
            .onStop(function () {
                console.log("animation stopped clearing killed blocks");
                blocks = [];
                console.log("blocks killed: " + blocksBeingKilled.length);
            })
            .start(function (alpha) {
                console.log("on animate");
                for (var i = 0; i < blocks.length; i++) {
                    var b = blocks[i];
                    //  y = s0 + v0*t + 0.5 * a *t * t
                    b.y = b.startY - (b.startVy * alpha - 9.82 * alpha * alpha * 0.5);
                    b.color[3] = Math.max(1 - alpha, 0);

                    // TODO add a little rotation as well..
                }

                // Make sure blocks will be drawn
                blocksBeingKilled = blocks;

                draw();
            }
        );
    }

    function explosionAnimation(blocks) {
        var initialV = 10;
        var g = 9.82;
        // initial animation conditions for each block
        blocks.forEach(function (b) {
            if (b.animation) {
                // Kill and remove any current animations
                b.animation.stop();
                b.animation = undefined;
                // Since this is the final animation of a block no reference will be set again for b.animation
            }

            b.z = 0.5; // move blocks above others
            b.startX = b.x;
            b.startY = b.y;

            var randDir = Math.random() * 2 * Math.PI; // [0, 2pi]
            b.startVx = Math.cos(randDir) * initialV;
            b.startVy = Math.sin(randDir) * initialV;

            b.accY = g;
            b.accX = b.startVx;

            b.acc = Math.random() + 1;

            b.color = new Color().GREEN;
            b.rotV = ((Math.random() * 2) -1) * 50;
        });


        new Animation(500)
            .onStop(function () {
                console.log("animation stopped clearing killed blocks");
                blocks = [];
                console.log("blocks killed: " + blocksBeingKilled.length);
            })
            .start(function (alpha) {
                console.log("on animate");
                for (var i = 0; i < blocks.length; i++) {
                    var b = blocks[i];
                    // update x pos
                    b.x = b.startX - (b.startVx * alpha - b.accX * alpha * alpha * 0.5);

                    // update y pos
                    b.y = b.startY - (b.startVy * alpha - b.accY * alpha * alpha * 0.5);

                    // Fade out color
                    b.color[3] = Math.max(1 - alpha, 0);

                    // Rotation
                    b.rotZ = alpha * b.rotV;
                }

                // Make sure blocks will be drawn
                blocksBeingKilled = blocks;

                draw();
            }
        );
    }

    // FIXME for testing

    this.addBlockAt = function addBlockAt(i, j, type) {
        var t = type == undefined ? shaderMap.TYPE_ANY_COLOR : type;
        addBaseBlock(t, i, j, false);

        draw();
    };

    this.getBlockAt = function getBlockAt(i, j) {
        var filteredBlocks = getAllBlocks().filter(function(block) { return block.x == i && block.y == j; });
        return filteredBlocks[0];
    };

    this.getBlocksStatistics = function getBlocksStatistics(){
        return {
            aliveBlocks      : blocksAlive.length,
            setBlocks        : blocksSet.length,
            killedOffBlocks :  blocksBeingKilled.length
        }
    };

}

function BaseBlock(type, x, y) {
    this.color = new Color().WHITE;
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

    shader.getQualifierHandles(gl);

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
