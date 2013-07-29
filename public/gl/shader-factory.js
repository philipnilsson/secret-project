//TODO
function Shader() {
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
    this.verify = function verify() {
        // TODO verify that all is not -1

    }
};

function ShaderFactory(gl) {
    var self = this;

    this.makeShader = function makeShader(vsString, fsString) {
        var shader = new Shader();

        shader.fragmentShader = createShader(gl.FRAGMENT_SHADER, fsString);
        shader.vertexShader   = createShader(gl.VERTEX_SHADER, vsString);
        shader.program        = createAndLinkProgram(shader.vertexShader, shader.fragmentShader);

        return shader;
    }

    function createAndLinkProgram(vs, fs) {
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

    function createShader(glShaderType, src) {
        if (glShaderType && src) {
            var shader = gl.createShader(glShaderType);

            gl.shaderSource(shader, src);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
                return -1;
            }

            return shader;
        } else {
            console.log("no shadertype or shader source")
        }
    }
};

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