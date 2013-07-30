// TODO add glcheck error

function WebGLRenderer(gl) {
    var self = this;
    this.gl = gl;

    this.clearColor = [0.0, 0.0, 0.0, 1.0];

    this.camera = {
        eye    : [0, 0, 1],
        center : [0, 0, 0],
        up     : [0, 1, 0]
    }

    var glSquare = new GLSquare(gl);

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

    gl.clearColor(
        this.clearColor[0],
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

        // Draw Background
        // TODO 

        // Bind geoemtry
        glSquare.bind();

        if (allPieces != undefined) {
            //go through pieces and draw them.
            for (var i = 0; i < allPieces.length; i++) {
                var rect = allPieces[i];
                var shader     = rect.type;
                var qualifiers = shader.Qualifiers;

                // Use shader
                gl.useProgram(shader.program);

                //TODO type decide which shader to use or similar..
                // for now we use default from shader map

                // TODO Optimize matrix multiplications
                // Calculate Model Matrix
                // TODO move into glsquare
                mat4.identity(this.matrixM);
                mat4.translate(this.matrixM, [rect.x, rect.y, 0]);
                mat4.scale(this.matrixM, [0.9, 0.9, 1.0]);

                // Calculate MVP Matrix
                this.matrixMVP = createMVP(this.matrixM, this.matrixV, this.matrixP);

                // Bind attributes
                gl.vertexAttribPointer(qualifiers.vertexPosition.handle, 3, gl.FLOAT, false, 0, 0);

                // Bind uniforms
                if(qualifiers.MVP) {
                    gl.uniformMatrix4fv(qualifiers.MVP.handle, false, new Float32Array(this.matrixMVP));                    
                }

                // if we have color bind it to the shader
                if(qualifiers.color) {
                    gl.uniform4fv(qualifiers.color.handle, new Float32Array(rect.color));
                }

                // Draw
                glSquare.draw();
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

        glSquare.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glSquare.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        glSquare.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glSquare.indexBuffer);

        //upload data to gl
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareIndices), gl.STATIC_DRAW);
    }
};