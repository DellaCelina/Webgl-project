//proj3
function Shader(gl_context){
    this.gl = gl_context;
    this.InitShader = function (vertex, frag){
        if (!initShaders(this.gl, vertex, frag)) 
            console.log('Failed to intialize shaders.');
        // Get camera uniforms
        this.u_VPMatrix = this.gl.getUniformLocation(this.gl.program, 'u_VPMatrix');
        this.u_ViewPosition = this.gl.getUniformLocation(this.gl.program, 'u_ViewPosition');
        if(!this.u_VPMatrix || !this.u_ViewPosition)
            console.log('Failed camera');

        // Get model uniforms
        this.u_ModelMatrix = this.gl.getUniformLocation(this.gl.program, 'u_ModelMatrix');
        this.u_NormalMatrix = this.gl.getUniformLocation(this.gl.program, 'u_NormalMatrix');
        if(!this.u_ModelMatrix || !this.u_NormalMatrix)
            console.log('Failed Model');

        // Get light uniforms
        this.u_diffuseColor = new Array(2);
        this.u_specularColor= new Array(2);
        this.u_position= new Array(2);
        this.u_lookDirection = new Array(2);
        this.u_cutoff = new Array(2);
        for(var i=0; i<2; i++){
            this.u_diffuseColor[i] = this.gl.getUniformLocation(this.gl.program, 'u_Light[' + i + '].diffuseColor');
            this.u_specularColor[i] = this.gl.getUniformLocation(this.gl.program, 'u_Light[' + i + '].specularColor');
            this.u_position[i] = this.gl.getUniformLocation(this.gl.program, 'u_Light[' + i + '].position');
            this.u_lookDirection[i] = this.gl.getUniformLocation(this.gl.program, 'u_Light[' + i + '].lookDirection')
            this.u_cutoff[i] = this.gl.getUniformLocation(this.gl.program, 'u_Light[' + i + '].cutoff');
            if(!this.u_diffuseColor[i] || !this.u_specularColor[i] || !this.u_position[i] || !this.u_cutoff[i])
                console.log('Failed light');
        }

        // Get material uniforms
        this.u_ambientConst = this.gl.getUniformLocation(this.gl.program, 'u_Material.ambientConst');
        this.u_diffuseConst = this.gl.getUniformLocation(this.gl.program, 'u_Material.diffuseConst');
        this.u_specularConst = this.gl.getUniformLocation(this.gl.program, 'u_Material.specularConst');
        this.u_shininess = this.gl.getUniformLocation(this.gl.program, 'u_Material.shininess');
        if(!this.u_ambientConst || !this.u_diffuseConst || !this.u_specularConst || !this.u_shininess)
            console.log('Failed material');

        // Get ambient uniform
        this.u_ambient = this.gl.getUniformLocation(this.gl.program, 'u_AmbientLight');
        if(!this.u_ambient)
            console.log('Failed ambient');
    }

    this.SetCamera = function (PMatrix, lookP, centerP, cameraUp){
        var VPMatrix = PMatrix.lookAt(lookP[0], lookP[1], lookP[2], centerP[0], centerP[1], centerP[2], cameraUp[0], cameraUp[1], cameraUp[2]);
        this.gl.uniformMatrix4fv(this.u_VPMatrix, false, VPMatrix.elements);
        this.gl.uniform3f(this.u_ViewPosition, lookP[0] - centerP[0], lookP[1] - centerP[1], lookP[2] - centerP[2]);
    }

    this.SetModel = function (ModelMatrix){
        this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, ModelMatrix.elements);
        var normalMatrix = new Matrix4();
        normalMatrix.setInverseOf(ModelMatrix);
        normalMatrix.transpose();
        this.gl.uniformMatrix4fv(this.u_NormalMatrix, false, normalMatrix.elements);
    }

    this.SetLight= function (i, diffuseColor, specularColor, position, lookDirection, cutoffAngle){
        this.gl.uniform3fv(this.u_diffuseColor[i], diffuseColor);
        this.gl.uniform3fv(this.u_specularColor[i], specularColor);
        this.gl.uniform3fv(this.u_position[i], position);
        this.gl.uniform3fv(this.u_lookDirection[i], lookDirection);
        var cutoff = Math.cos(cutoffAngle * Math.PI / 180);
        this.gl.uniform1f(this.u_cutoff[i], cutoff);
    }

    this.SetMaterial = function (ambientConst, diffuseConst, specularConst, shininess){
        this.gl.uniform1f(this.u_ambientConst, ambientConst);
        this.gl.uniform1f(this.u_diffuseConst, diffuseConst);
        this.gl.uniform1f(this.u_specularConst, specularConst);
        this.gl.uniform1f(this.u_shininess, shininess);
    }

    this.SetAmbient = function (r, g, b){
        this.gl.uniform3f(this.u_ambient, r, g, b);
    }

}

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
    }

    var shader = new Shader(gl);
    // Get shader code
    var vertex_src = document.getElementById('vertex-shader').text;
    var frag_src = document.getElementById('fragment-shader').text;
    shader.InitShader(vertex_src, frag_src);

    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
    return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Set Lights
    shader.SetAmbient(0.3, 0.3, 0.3);
    var diffuseColor = [1.0, 1.0, 1.0];
    var specularColor = [1.0, 1.0, 1.0];
    var position = [0.0, 1.5, 1.5];
    var lookDirection = [0.0, -1.5, -1.5]
    var cutoffAngle = 27;
    shader.SetLight(0, diffuseColor, specularColor, position, lookDirection, cutoffAngle);

    var diffuseColor = [1.0, 1.0, 1.0];
    var specularColor = [1.0, 1.0, 1.0];
    var position = [0.0, 0.0, 1.5];
    var lookDirection = [0.0, 0.0, -1.0]
    var cutoffAngle = 30;
    shader.SetLight(1, diffuseColor, specularColor, position, lookDirection, cutoffAngle);

    // Set Material
    shader.SetMaterial(1.0, 0.9, 1.0, 10.0);

    // Set Camera
    var PMatrix = new Matrix4();
    var lookPoint = [0, 0, 6];
    var centerPoint = [0, 0, 0];
    var cameraUpVector = [0, 1, 0];
    PMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    shader.SetCamera(PMatrix, lookPoint, centerPoint, cameraUpVector);

    // Set Model
    var modelMatrix = new Matrix4();  // Model matrix
    modelMatrix.setRotate(90, 0, 1, 0); // Rotate around the y-axis
    shader.SetModel(modelMatrix);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

function initVertexBuffers(gl) { // Create a sphere
    var SPHERE_DIV = 80;
    var i, ai, si, ci;
    var j, aj, sj, cj;
    var p1, p2;

    var positions = [];
    var indices = [];

    // Generate coordinates
    for (j = 0; j <= SPHERE_DIV; j++) {
        aj = j * Math.PI / SPHERE_DIV;
        sj = Math.sin(aj);
        cj = Math.cos(aj);
        for (i = 0; i <= SPHERE_DIV; i++) {
            ai = i * 2 * Math.PI / SPHERE_DIV;
            si = Math.sin(ai);
            ci = Math.cos(ai);

            positions.push(si * sj);  // X
            positions.push(cj);       // Y
            positions.push(ci * sj);  // Z
        }
    }

    // Generate indices
    for (j = 0; j < SPHERE_DIV; j++) {
        for (i = 0; i < SPHERE_DIV; i++) {
            p1 = j * (SPHERE_DIV+1) + i;
            p2 = p1 + (SPHERE_DIV+1);

            indices.push(p1);
            indices.push(p2);
            indices.push(p1 + 1);

            indices.push(p1 + 1);
            indices.push(p2);
            indices.push(p2 + 1);
        }
    }

    // Write the vertex property to buffers (coordinates and normals)
    // Same data can be used for vertex and normal
    // In order to make it intelligible, another buffer is prepared separately
    if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3))  return -1;
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttrib4f(a_Color, 0.5, 0.3, 1.0, 1.0);

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    return true;
}
