/**
 * Definition of standard shader qualifiers
 * @type {{MVP: string, VERTEX_POSITION: string, COLOR: string}}
 */
var StandardQualifierNames = {
    MVP             : "mvp",
    VERTEX_POSITION : "vertexPosition",
    COLOR           : "color"
};

function Qualifier(name, glslName) {
    this.name     = name;
    this.glslName = glslName;
    this.handle   = -1;
    this.value    = -1;
    // todo could add bind function as well
}

function Shader() {
    var self = this;
    var sqn = StandardQualifierNames;

    this.program = -1;
    this.fragmentShader = -1;
    this.vertexShader = -1;

    // TODO ref: #1
    this.qualifiers =
        [
            new Qualifier(sqn.MVP, "uMVP"),
            new Qualifier(sqn.COLOR, "uColor"),
            new Qualifier(sqn.VERTEX_POSITION, "aVertexPosition")
        ];

    /**
     * Verfies that the shader is properly initiated
     */
    this.verify = function verify() {
        var failedVerification = false;
        var report = undefined;

        for(var i=0; i<self.qualifiers.length; i++) {
            var q = self.qualifiers[i];
            if(q.handle == -1) {
                failedVerification = true;
                report = q.name + " handle was not bound with GLSL variable: " + q.glslName;
                break;
            }
        }

        return {failed : failedVerification, report : report};
    };

    this.getQualifierHandles = function getQualifierHandles(gl) {
        // TODO here we could find the qualifiers from the shader code itself instead of hard coding it.. in #1

        self.qualifiers.forEach(function(q){
           switch (q.name) {
               case sqn.COLOR:
                   q.handle = gl.getUniformLocation(self.program, q.glslName);
                   break;
               case sqn.MVP:
                   q.handle = gl.getUniformLocation(self.program, q.glslName);
                   break;
               case sqn.VERTEX_POSITION:
                   q.handle = gl.getAttribLocation(self.program, q.glslName);
                   gl.enableVertexAttribArray(q.handle);
                   break;
           }
        });

        console.log("bound qualifier handles");
    };
}

function ShaderFactory(gl) {

    this.makeShader = function makeShader(vsString, fsString) {
        var shader = new Shader();

        shader.fragmentShader = createShader(gl.FRAGMENT_SHADER, fsString);
        shader.vertexShader   = createShader(gl.VERTEX_SHADER, vsString);
        shader.program        = createAndLinkProgram(shader.vertexShader, shader.fragmentShader);

        // if shader compiled successfully get the handles..
        shader.getQualifierHandles(gl);

        var verification = shader.verify();

        if(verification.failed) {
            alert("Verification of shader failed: " + verification.report);
        }

        return shader;
    };

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
        var shader = gl.createShader(glShaderType);

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("Error while compiling " + getShaderName(glShaderType) + ": " + gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    /**
     * Convenience function to get a readable name of GLSL shader types
     * @param shaderType The type of shader
     * @returns {string}
     */
    function getShaderName(shaderType) {
        switch (shaderType) {
            case gl.VERTEX_SHADER:
                return "Vertex Shader";
            case gl.FRAGMENT_SHADER:
                return "Fragment Shader";
        }

        return "Unknown shader type: " + shaderType;
    }
}