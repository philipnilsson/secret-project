// TODO add glcheck error

/**
 *
 * @param gl
 * @param grid Defaults to: { w:10, h:20 }
 * @constructor
 */
function WebGLRenderer(gl, grid) {
    var self = this;
    this.gl = gl;

    var useBlending = true;
    this.clearColor = [0.27, 0.27, 0.27, 1.0];

    this.camera = {
        eye    : [0, 0, 1],
        center : [0, 0, 0],
        up     : [0, 1, 0]
    }

    var glSquare = new GLSquare(gl);

    // TODO do not need to expose these matrices.

    // Model matrix
    this.matrixM   = mat4.create();

    // View matrix
    this.matrixV   = mat4.create();

    // Projection matrix
    this.matrixP   = mat4.create();

    // Model-View-Projection matrix
    this.matrixMVP = mat4.create();

    if(grid) {
        this.grid = grid;
    } else {
        this.grid = {
            w : 10,
            h : 20
        };
    }

    // Constructor ===================================================
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }

    //Setup projection matrix
    self.matrixP = mat4.ortho(0, self.grid.w, self.grid.h, 0, 0.1, 10);

    //Setup view matrix
    self.matrixV = mat4.lookAt(self.camera.eye, self.camera.center, self.camera.up);

    gl.clearColor(
        self.clearColor[0],
        self.clearColor[1],
        self.clearColor[2],
        self.clearColor[3]);

    // Setup depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    // Setup blending
    if(useBlending) {
        gl.depthFunc(gl.LESS);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquation(gl.FUNC_ADD);
    }

    initRenderableBlock(gl);

    // ================================================================

    function drawBackground(shader) {
        var qualifiers = shader.Qualifiers;

        // bind geometry
        glSquare.bind();

        // compute MVP for geometry
        self.matrixM = glSquare.getModelMatrix([0, 0, -1], [10, 20, 1.0]);
        self.matrixMVP = calculateMVP(self.matrixM, self.matrixV, self.matrixP);

        // enable shader
        gl.useProgram(shader.program);

        // Bind attributes
        gl.vertexAttribPointer(qualifiers.vertexPosition.handle, 3, gl.FLOAT, false, 0, 0);

        // Bind uniforms
        if (qualifiers.MVP) {
            gl.uniformMatrix4fv(qualifiers.MVP.handle, false, new Float32Array(self.matrixMVP));
        }

        if (qualifiers.color) {
            // black bg
            gl.uniform4fv(qualifiers.color.handle, new Float32Array([0, 1, 0, 0.5]));
        }

        // Draw
        glSquare.draw();

    }

    function drawBgMatrix(allBlocks) {
        if (allBlocks) {
            glSquare.bind();
            //go through pieces and draw them.
            for (var i = 0; i < 10; i++) {
                for (var j = 0; j < 20; j++) {
                    var block = allBlocks[i][j];
                    var shader = block.type;
                    var qualifiers = shader.Qualifiers;

                    // Tetris block stahder
                    gl.useProgram(shader.program);

                    // TODO Optimize matrix multiplications
                    // Calculate Model Matrix
                    self.matrixM = glSquare.getModelMatrix([block.x, block.y, block.z], [0.9, 0.9, 1.0]);

                    // Combine M, V and P into the MVP Matrix
                    calculateMVP(self.matrixM, self.matrixV, self.matrixP);

                    // Bind attributes
                    gl.vertexAttribPointer(qualifiers.vertexPosition.handle, 3, gl.FLOAT, false, 0, 0);

                    // Bind uniforms
                    if(qualifiers.MVP) {
                        gl.uniformMatrix4fv(qualifiers.MVP.handle, false, new Float32Array(self.matrixMVP));
                    }

                    // if we have color bind it to the shader
                    if(qualifiers.color) {
                        gl.uniform4fv(qualifiers.color.handle, new Float32Array(block.color));
                    }

                    // Draw
                    glSquare.draw();
                }
            }
        }
    }

    function drawBlocks(allBlocks) {
        if (allBlocks != undefined) {
            glSquare.bind();
            //go through pieces and draw them.
            for (var i = 0; i < allBlocks.length; i++) {
                var block = allBlocks[i];
                var shader = block.type;
                var qualifiers = shader.Qualifiers;

                // Tetris block stahder
                gl.useProgram(shader.program);

                // TODO Optimize matrix multiplications
                // Calculate Model Matrix
                self.matrixM = glSquare.getModelMatrix([block.x, block.y, block.z], [0.9, 0.9, 1.0]);

                // Combine M, V and P into the MVP Matrix
                calculateMVP(self.matrixM, self.matrixV, self.matrixP);

                // Bind attributes
                gl.vertexAttribPointer(qualifiers.vertexPosition.handle, 3, gl.FLOAT, false, 0, 0);

                // Bind uniforms
                if(qualifiers.MVP) {
                    gl.uniformMatrix4fv(qualifiers.MVP.handle, false, new Float32Array(self.matrixMVP));
                }

                // if we have color bind it to the shader
                if(qualifiers.color) {
                    gl.uniform4fv(qualifiers.color.handle, new Float32Array(block.color));
                }

                // Draw
                glSquare.draw();
            }
        }
    }

    this.draw = function draw(allBlocks, bgblocks) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if(bgblocks.length > 0) {
            drawBgMatrix(bgblocks);
        }

        if(allBlocks.length != 0) {
            drawBlocks(allBlocks);
        }

        if (printMVPOnce) {
            printMVP(this.matrixM, this.matrixV, this.matrixP, this.matrixMVP);
            printMVPOnce = false
        }

    }

    function calculateMVP(M, V, P) {
        //TODO type decide which shader to use or similar..
        mat4.identity(self.matrixMVP);
        mat4.multiply(P, V, self.matrixMVP);
        mat4.multiply(self.matrixMVP, M, self.matrixMVP);

        return self.matrixMVP;
    }

    function initRenderableBlock(gl) {
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

        glSquare.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glSquare.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        glSquare.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glSquare.indexBuffer);

        //upload data to gl
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareIndices), gl.STATIC_DRAW);
    }
}

