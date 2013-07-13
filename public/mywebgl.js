
var board;


//TEST ONLY
var livePieceX = 0;
var livePieceY = 0;


var testMatrix = [
    [1, 0, 0, 0, 1],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [1, 0, 0, 0, 1] ];


shaderMap = {
    TYPE_DEFAULT : null, //Normal piece
    TYPE_1 : null,
    TYPE_2 : null,
    TYPE_3 : null,
    TYPE_4 : null,
    TYPE_5 : null,
    TYPE_6 : null,
    TYPE_7 : null,
    TYPE_8 : null
}


// Prints the M V P matrices
var printOnce = false;

function GLSquare(){
    //TODO
    var indexBuffer;
    var vertexBuffer;



    this.bind = function bind(){

    }

    this.draw = function draw(){

    }

}


function start(){
    var canvas = document.getElementById("glCanvas");
    var gl = this.gl = canvas.getContext("webgl");
    board = new TetrisBoard(new WebGLRenderer(gl));
    log("this is board: " + board);

//    TODO remove.. for test only
//    board.drawShapeAt(testMatrix, null, 0, 0);


    // Setup shader map
    shaderMap.TYPE_DEFAULT = createDefaultShader(gl);

    setInterval(draw, 15);
};


function draw(){
    board.draw();
}


function TetrisPiece(rectangles, pivotX, pivotY){
    this.rects = rectangles;
    this.pivotX = pivotX;
    this.pivotY = pivotY;

    this.kill = function kill(){
        for (var i = 0; i < this.rects.length; i++) {
            this.rects[i].kill();
        }
    }

    this.move = function move(x, y){
        log("current pos: " + this.pivotX + "," + this.pivotY)

        var dx = this.pivotX - x;
        var dy = this.pivotY - y;

        if( dx != 0 || dy != 0){
            for (var i = 0; i < this.rects.length; i++) {
                this.rects[i].move(dx, dy);
            }

            this.pivotX = x;
            this.pivotY = y;
        }


        log("new pos: " + this.pivotX + "," + this.pivotY)
    }

}


//Geometry ===========================================================================================
var glSquare = {
    indexBuffer  : -1,
    vertexBuffer : -1
}

function initTetrisRenderElement(gl){
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
        0,  1,  2,
        0,  2,  3
    ];


    glSquare.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glSquare.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    glSquare.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glSquare.indexBuffer);

    //upload data to gl
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareIndices), gl.STATIC_DRAW);
};
//====================================================================================================


function WebGLRenderer(gl) {
    this.clearColor = [0.0, 0.0, 0.0, 1.0];
    this.gl = gl;

    this.camera = {
        eye    : [0, 0, 1],
        center : [0, 0, 0],
        up     : [0, 1, 0]
    }

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


    if(!gl){
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

    createDefaultShader(this.gl);
    initTetrisRenderElement(this.gl);

    // ================================================================

    function createMVP(M, V, P) {
        var MVP = mat4.create();
        mat4.identity(MVP)
        mat4.multiply(P, V, MVP);
        mat4.multiply(MVP, M, MVP);

        return MVP;
    }

    this.draw = function draw(allPieces){
        var gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //TODO square.bind()
        gl.bindBuffer(gl.ARRAY_BUFFER, glSquare.vertexBuffer);
        gl.vertexAttribPointer(handleVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glSquare.indexBuffer);


        //go through pieces and draw them.
        for (var i = 0; i < allPieces.length; i++) {
            var rect = allPieces[i];

            //get using type..
            var shader = shaderMap.TYPE_DEFAULT;
            //TODO type decide which shader to use or similar..
            // for now we use default from shader map
            gl.useProgram(shader.program);

            //FIXME Should be related to the piece being rendered.
            //setup model testMatrix
            mat4.identity(this.matrixM);
            mat4.translate(this.matrixM, [rect.x, rect.y, 0]);

            //TODO Bind attributes for that particular square
            //Create and bind MVP
            this.matrixMVP = createMVP(this.matrixM, this.matrixV, this.matrixP);
//            var handleMVP = gl.getUniformLocation(shader.program, "uMVP");
            gl.uniformMatrix4fv(shader.handleMVP, false, new Float32Array(this.matrixMVP));

            //TODO square.draw()
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        }

        if(printOnce){
            printMVP(this.matrixM, this.matrixV, this.matrixP, this.matrixMVP);
            printOnce = false
        }
    }

}

function TetrisBoard(renderer){
    var self = this;
    this.renderer = renderer;
    this.livePiece = null;

    //TODO allocate memory
    this.allPieces = [];

    this.draw = function draw(){
        this.renderer.draw(this.allPieces);

    }

    this.killLivePiece = function killLivePiece(){
        if(this.livePiece){
            this.livePiece.kill();
            this.livePiece = null;

            //TODO remove
            //reset test position
            livePieceX = 0;
            livePieceY = 0;
        }
    };

    this.clearRows = function clearRows(listOfRows){
        var otherObjects = this.allPieces.filter(function(tetrisElement) {
            return listOfRows.indexOf(tetrisElement.y) == -1
        });

        if(this.allPieces.length != otherObjects.length){
            this.allPieces = otherObjects;
        }
    }

    this.updatePositions = function (emptyrows) {
        //shift all pieces above one step down
//        var startRow = 19;

        this.allPieces.forEach(function(piece){
            var nYShifts = emptyrows.filter(function(o){return piece.y <= o; }).length;
            piece.y += nYShifts;

        })
    };

    this.clearLastRow = function clearLastRow(){
        this.clearRows([19]);

        //update positions
        this.updatePositions([19]);
    }

    this.clear = function clear(){
        if(this.livePiece){
            this.killLivePiece();
        }
        this.allPieces = []
    }

    //Matrix must be nxn
    this.createTetrisPiece = function createTetrisPiece(matrix, type, x, y) {
        log("this is self: " + self);

        //TODO count non zeros of testMatrix to align size
        var baseElements = [];

        //FIXME TEST add one

        //loop through testMatrix and create TetrisRect's
        var len = matrix.length;


        //TODO instead of doing fors maybe some js magic?
        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len; j++) {
                if (matrix[j][i]) {
                    baseElements.push(this.addTetrisBaseElement(type, x + i, y + j));
                }
            }
        }

        //bind them to live object
        return new TetrisPiece(baseElements, x, y);

    }

    this.addTetrisBaseElement = function addTetrisBaseElement(type, x, y){
        var rect = new TetrisBaseElement(type, x, y);

        self.allPieces.push(rect);
        return rect;
    }

    this.drawShapeAt = function drawShapeAt(matrix, type, x, y){
        if(this.livePiece){
            log("move x y: " + x, "," + y);
            this.livePiece.move(x,y);
        }else{
            this.livePiece = this.createTetrisPiece(matrix, type, x, y);
        }
    }

    function TetrisBaseElement(type, x, y){
        this.type = type;
        this.x = x;
        this.y = y;
        this.alive = true;


        this.kill = function kill(){
            this.alive = false;
        }

        this.resurrect = function resurrect(){
            this.alive = true;
        }

        //takes alive state into consideration
        // only alive objects can be moved with this function.
        this.move = function move(dx, dy){
            if(this.alive){
                this.forceMove(dx, dy);
            }
        }

        //Disregards alive state
        this.forceMove = function forceMove(dx, dy){
            this.x -= dx;
            this.y -= dy;
        }
    }
}


// Shaders ============================================================================================
//TODO write shaderhandler

//TODO
function ShaderFactory(gl){
    var self = this;
    this.gl = gl;

    this.makeShader = function makeShader(vsString, fsString){
        var shader = new Shader();

        shader.fragmentShader = createShader(gl.FRAGMENT_SHADER, fsString);
        shader.vertexShader   = createShader(gl.VERTEX_SHADER, vsString);
        shader.program        = createAndLinkProgram(shader.vertexShader, shader.fragmentShader);

        return shader;
    }

    function createAndLinkProgram(vs, fs){
        var gl = self.gl;

        var program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        // If creating the shader program failed, alert
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program.");
        }

        return program

    }

    function createShader(glShaderType, src){
        if( glShaderType && src){
            var gl = self.gl;

            var shader = gl.createShader(glShaderType);

            gl.shaderSource(shader, src);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
                return -1;
            }


            return shader;
        }else{
            console.log("no shadertype or shader source")
        }
    }

//    function loadShader(gl, id) {
//        var shaderScript = document.getElementById(id);
//
//        // Didn't find an element with the specified ID; abort.
//        if (!shaderScript) {
//            return null;
//        }
//
//        // Walk through the source element's children, building the
//        // shader source string.
//
//        var theSource = "";
//        var currentChild = shaderScript.firstChild;
//
//        while(currentChild) {
//            if (currentChild.nodeType == 3) {
//                theSource += currentChild.textContent;
//            }
//
//            currentChild = currentChild.nextSibling;
//        }
//
//        // Now figure out what type of shader script we have,
//        // based on its MIME type.
//
//        var shader;
//
//        if (shaderScript.type == "x-shader/x-fragment") {
//            shader = gl.createShader(gl.FRAGMENT_SHADER);
//        } else if (shaderScript.type == "x-shader/x-vertex") {
//            shader = gl.createShader(gl.VERTEX_SHADER);
//        } else {
//            return null;  // Unknown shader type
//        }
//
//        // Send the source to the shader object
//
//        gl.shaderSource(shader, theSource);
//
//        // Compile the shader program
//
//        gl.compileShader(shader);
//
//        // See if it compiled successfully
//
//        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
//            return null;
//        }
//
//        return shader;
//    }

};

//TODO
function Shader(){
    this.program = -1;
    this.fragmentShader = -1;
    this.vertexShader = -1;

    //Per vertex attributes
    this.handleVertexPosition = -1;
    this.handleNormal = -1;
    this.handleTangnet = -1;



    /**
     * Verfies that the shader is properly initiated
     */
    this.verify = function verify(){

    }
};


//FIXME In use ATM
var handleVertexPosition;
var shaderProgram;


function getShaderSrc(id, type){
    var shaderScript = document.getElementById(id);

    // Didn't find an element with the specified ID; abort.
    if (!shaderScript) {
        return null;
    }

    // Walk through the source element's children, building the
    // shader source string.

    var theSource = "";
    var currentChild = shaderScript.firstChild;

    while(currentChild) {
        if (currentChild.nodeType == 3) {
            theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }

    return theSource
}


function createDefaultShader(gl){

        // Now figure out what type of shader script we have,
        // based on its MIME type.
    var srcFS = getShaderSrc("shader-fs");
    var srcVS = getShaderSrc("shader-vs");

    var sf = new ShaderFactory(gl);
    var shader = sf.makeShader(srcVS, srcFS);

//    var fragmentShader = loadShader(gl, "shader-fs");
//    var vertexShader = loadShader(gl, "shader-vs");

//    Create the shader program
//    shaderProgram = gl.createProgram();
//    gl.attachShader(shaderProgram, vertexShader);
//    gl.attachShader(shaderProgram, fragmentShader);
//    gl.linkProgram(shaderProgram);
//
//    If creating the shader program failed, alert
//    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
//        alert("Unable to initialize the shader program.");
//    }

    gl.useProgram(shader.program);

    shader.handleVertexPosition = gl.getAttribLocation(shader.program, "aVertexPosition");
    shader.handleMVP = gl.getUniformLocation(shader.program, "uMVP");

    gl.enableVertexAttribArray(shader.handleVertexPosition);

    return shader;

};

// ====================================================================================================


// Helper functions ===================================================================================

function generateRandomPieces(){
    var w = 10;
    var h = 20;
    var nPieces = Math.random() * w * h;

    for (var i = 0; i < nPieces; i++) {
        board.addTetrisBaseElement(0, Math.round(Math.random() * w), Math.round(Math.random() * h));
    }
}

function printMat4(matrix){
    var str = "";
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            str += matrix[i*4 + j] + " ";
        }
        str += "\n"
    }
}

function log(text){
    console.log(text);
}

function printMVP(matrixM, matrixV, matrixP, matrixMVP) {
    log("M");
    printMat4(matrixM);

    log("V");
    printMat4(matrixV);

    log("P");
    printMat4(matrixP);


    log("MVP");
    printMat4(matrixMVP);
}

// test movement
document.onkeydown = function(e){
    switch (e.keyCode){
        case 38: //up
            livePieceY--;
            break;
        case 37: //left
            livePieceX--;
            break;
        case 39:    //right
            livePieceX++;
            break;
        case 40: // down
            livePieceY++;
            break;
        case 32:
            //space 32
            break;
        case 75: //k
            if(board.livePiece){
                board.killLivePiece();
            }
            break;
        case 67: //c
            log("clearing board");
            board.clear();
            return;
        case 71: //g
            log("generate random pieces");
            generateRandomPieces();
            break;

        case 86: //v
            log("clear rows");
            board.clearLastRow();
//            board.clearRows([0,3,5]);
            return;

        default :
            console.log(e.keyCode);
            return;

    }


    board.drawShapeAt(testMatrix, null, livePieceX, livePieceY);
};

// ====================================================================================================
