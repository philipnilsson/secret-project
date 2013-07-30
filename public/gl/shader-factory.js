
function Shader() {
    var self = this;
    this.program = -1;
    this.fragmentShader = -1;
    this.vertexShader = -1;

    this.Qualifiers = {
        // Uniforms
        MVP            : { handle : -1, name : "uMVP" },
        color          : { handle : -1, name : "uColor" },

        // Attributes    
        vertexPosition : { handle : -1, name : "aVertexPosition" }
        //TODO
        // normal         : "aNormal",
        // biNormal       : "aBiNormal",
        // tangent        : "aTangent"
    }

    /**
     * Verfies that the shader is properly initiated
     */
    this.verify = function verify() {
        var keys = Object.keys(self.Qualifiers);

        for (var i = 0; i < keys.length; i++) {
            if (self.Qualifiers[keys[i]].handle == -1) {
                console.log("no handle for: " + keys[i]);
                return false;
            }
        }

        return true;
    };

    this.bindQualifiers = function bindQualifiers(gl) {
        var q = self.Qualifiers;
        //TODO
        q.vertexPosition.handle = gl.getAttribLocation(self.program, q.vertexPosition.name);
        q.MVP.handle = gl.getUniformLocation(self.program, q.MVP.name);
        q.color.handle = gl.getUniformLocation(self.program, q.color.name);

        gl.enableVertexAttribArray(q.vertexPosition.handle);
    }
}

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
                shader = -1;
            }

            return shader;
        } else {
            console.log("no shadertype or shader source")
            return -1;
        }
    }
}