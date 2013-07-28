// Prints the M V P matrices
var printOnce = false;

function GLSquare(gl) {
    var self = this;

    this.indexBuffer  = -1;
    this.vertexBuffer = -1;

    this.bind = function bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
    }

    this.draw = function draw() {
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}


function WebGLRenderer(gl) {
    var self = this;
    this.gl = gl;

    this.clearColor = [0.0, 0.0, 0.0, 1.0];

    this.camera = {
        eye    : [0, 0, 1],
        center : [0, 0, 0],
        up     : [0, 1, 0]
    }

    this.glSquare = new GLSquare(gl);

    this.matrixM   = mat4.create();
    this.matrixV   = mat4.create();
    this.matrixP   = mat4.create();
    this.matrixMVP = mat4.create();

    //TODO remove hard coding grid and rather set it
    this.grid = {
        w : 10,
        h : 20
    }

    // Constructor ===================================================

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }

    //  var ratio = canvas.width / canvas.height;
    //  var matrixP = mat4.perspective(45, ratio, 0.1, 100.0);

    //setup projection testMatrix
    this.matrixP = mat4.ortho(0, this.grid.w, this.grid.h, 0, 0.1, 100);

    //setup view testMatrix
    this.matrixV = mat4.lookAt(this.camera.eye, this.camera.center, this.camera.up);

    gl.clearColor(this.clearColor[0],
        this.clearColor[1],
        this.clearColor[2],
        this.clearColor[3]);  // Clear to black, fully opaque
    
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    initTetrisRenderElement(gl);

    // ================================================================

    this.draw = function draw(allPieces) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Bind geoemtry
        self.glSquare.bind();

        if (allPieces != undefined) {
            //go through pieces and draw them.
            for (var i = 0; i < allPieces.length; i++) {
                var rect = allPieces[i];

                // Get the current shader
                var shader = rect.type;
                
                // Use shader
                gl.useProgram(shader.program);

                //TODO type decide which shader to use or similar..
                // for now we use default from shader map

                // TODO Optimize matrix multiplications
                // Calculate Model Matrix
                mat4.identity(this.matrixM);
                mat4.translate(this.matrixM, [rect.x, rect.y, 0]);
                mat4.scale(this.matrixM, [0.9, 0.9, 1.0]);

                // Calculate MVP Matrix
                this.matrixMVP = createMVP(this.matrixM, this.matrixV, this.matrixP);

                // Bind attributes
                gl.vertexAttribPointer(shader.handleVertexPosition, 3, gl.FLOAT, false, 0, 0);

                // Bind uniforms
                gl.uniformMatrix4fv(shader.handleMVP, false, new Float32Array(this.matrixMVP));

                // Draw
                self.glSquare.draw();
            }
        }

        if (printOnce) {
            printMVP(this.matrixM, this.matrixV, this.matrixP, this.matrixMVP);
            printOnce = false
        }
    }

    function createMVP(M, V, P) {
        var MVP = mat4.create();
        mat4.identity(MVP)
        mat4.multiply(P, V, MVP);
        mat4.multiply(MVP, M, MVP);

        return MVP;
    }

    function initTetrisRenderElement(gl) {
        var z = 0.0;
        var w = 1.0;
        var h = 1.0;

        var vertices = [
            0, 0, z,
            w, 0, z,
            w, h, z,
            0, h, z
        ];

        var squareIndices = [
            0, 1, 2,
            0, 2, 3
        ];

        self.glSquare.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, self.glSquare.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        self.glSquare.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.glSquare.indexBuffer);

        //upload data to gl
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareIndices), gl.STATIC_DRAW);
    }
};

function TetrisBoard(renderer) {
    var self = this;
    this.renderer = renderer;

    var shaderMap = {
        TYPE_DEFAULT : createDefaultShader(renderer.gl), //Normal piece
        TYPE_SET     : createSetShader(renderer.gl),
    }

    // TODO create a pool of live blocks and re-use them
    this.liveBlocks = [];

    this.setBlocks = [];

    this.init = function init() {
        self.draw();
    }

    this.draw = function draw() {
        console.log('draw')
        var allBlocks = self.liveBlocks.concat(self.setBlocks)
        self.renderer.draw(allBlocks);

    }

    // Intervadl of 15 ms ~60fps
    this.renderWithInterval = function renderWithInterval(interval) {
        if(interval == undefined) interval = 15;
        setInterval(self.draw, interval);
    }


    this.setBlock = function setBlock(matrix, x, y) {
        self.liveBlocks = [];

        var len = matrix.length;

        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len; j++) {
                if (matrix[j][i]) {
                    self.addTetrisBaseElement(shaderMap.TYPE_SET, x + i, y + j, false);
                }
            }
        }
    }


    this.addTetrisBaseElement = function addTetrisBaseElement(type, x, y, alive) {
        var rect = new TetrisBaseElement(type, x, y);

        if (alive) {
            self.liveBlocks.push(rect);
        } else {
            self.setBlocks.push(rect);
        }

        return rect;
    }

    this.clearRows = function clearRows(listOfRows) {
        console.log("rows to clear: " + listOfRows)


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
                    self.addTetrisBaseElement(shaderMap.TYPE_DEFAULT, x + i, y + j, true)
                }
            }
        }
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
