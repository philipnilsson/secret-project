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

    this.clearColor = [0.27, 0.27, 0.27, 1.0];

    this.camera = {
        eye    : [0, 0, 1],
        center : [0, 0, 0],
        up     : [0, 1, 0]
    }

    var squareModel = new SquareModel(gl);

    // Model matrix
    var matrixM   = mat4.create();

    // View matrix
    var matrixV   = mat4.create();

    // Projection matrix
    var matrixP   = mat4.create();

    // Model-View-Projection matrix
    var matrixMVP = mat4.create();

    // If we want to use transparency
    var useBlending = true;

    if(!grid) grid = { w : 10, h : 20 };

    // Constructor ===================================================
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }

    //Setup projection matrix
    matrixP = mat4.ortho(0, grid.w, grid.h, 0, 0.1, 10);

    //Setup view matrix
    matrixV = mat4.lookAt(self.camera.eye, self.camera.center, self.camera.up);

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

    /**
     *
     * @param allBlocks an NxN array
     */
    function drawMatrix(allBlocks) {
        var nCols = allBlocks.length;
        var nRows = allBlocks[0].length;

        if (allBlocks) {
            squareModel.bind();
            for (var i = 0; i < nCols; i++) {
                for (var j = 0; j < nRows; j++) {
                    var block = allBlocks[i][j];
                    var shader = block.type;

                    // Tetris block shader
                    gl.useProgram(shader.program);

                    // TODO Optimize matrix multiplications
                    // Calculate Model Matrix
                    matrixM = squareModel.getModelMatrix([block.x, block.y, block.z], [0.9, 0.9, 1.0]);

                    // Combine M, V and P into the MVP Matrix
                    calculateMVP(matrixM, matrixV, matrixP);

                    // Bind qualifiers
                    shader.qualifiers.forEach(function(q){
                        switch (q.name) {
                            case StandardQualifierNames.MVP:
                                gl.uniformMatrix4fv(q.handle, false, new Float32Array(matrixMVP));
                                break;
                            case StandardQualifierNames.VERTEX_POSITION:
                                // Bind attributes
                                gl.vertexAttribPointer(q.handle, 3, gl.FLOAT, false, 0, 0);
                                break;
                            case StandardQualifierNames.COLOR:
                                gl.uniform4fv(q.handle, new Float32Array(block.color));
                                break;
                        }
                    });

                    // Draw
                    squareModel.draw();
                }
            }
        }
    }

    function drawBlocks(allBlocks) {
        if (allBlocks != undefined) {
            squareModel.bind();
            //go through pieces and draw them.
            for (var i = 0; i < allBlocks.length; i++) {
                var block = allBlocks[i];
                var shader = block.type;

                // Tetris block stahder
                gl.useProgram(shader.program);

                // TODO Optimize matrix multiplications
                // Calculate Model Matrix
                matrixM = squareModel.getModelMatrix([block.x, block.y, block.z], [0.9, 0.9, 1.0], [block.rotZ, block.rotZ, block.rotZ]);

                // Combine M, V and P into the MVP Matrix
                calculateMVP(matrixM, matrixV, matrixP);

                // Bind qualifiers
                shader.qualifiers.forEach(function(q){
                    switch (q.name) {
                        case StandardQualifierNames.MVP:
                            gl.uniformMatrix4fv(q.handle, false, new Float32Array(matrixMVP));
                            break;
                        case StandardQualifierNames.VERTEX_POSITION:
                            // Bind attributes
                            gl.vertexAttribPointer(q.handle, 3, gl.FLOAT, false, 0, 0);
                            break;
                        case StandardQualifierNames.COLOR:
                            gl.uniform4fv(q.handle, new Float32Array(block.color));
                            break;
                    }
                });

                // Draw
                squareModel.draw();
            }
        }
    }

    this.draw = function draw(allBlocks, bgblocks) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if(bgblocks.length > 0) {
            drawMatrix(bgblocks);
        }

        if(allBlocks.length != 0) {
            drawBlocks(allBlocks);
        }

        if (printMVPOnce) {
            printMVP(this.matrixM, this.matrixV, this.matrixP, this.matrixMVP);
            printMVPOnce = false
        }
    };

    function calculateMVP(M, V, P) {
        mat4.identity(matrixMVP);
        mat4.multiply(P, V, matrixMVP);
        mat4.multiply(matrixMVP, M, matrixMVP);

        return matrixMVP;
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

        squareModel.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareModel.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        squareModel.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareModel.indexBuffer);

        //upload data to gl
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareIndices), gl.STATIC_DRAW);
    }


    /**
     * Improved draw loop
     */
    function improvedDraw(effects) {
        // for each effect ie shader

        for(var i=0; i<effects.length; i++) {
            var shader = effects[i];

            var qualifiers = shader.getQualifiers();

            shader.getQualifierHandles(squareModel)

            // get all models with that effect

        }
    }
}

