//proj3

var lookPoint = [0, 0, 5];
var centerPoint = [0, 0, 0];
var cameraUpVector = [0, 1, 0];
var cameraAngle = 30;
var cameraNear = 1;
var cameraFar = 100;

var lampHeight = 0.05;
var lampScale = [0.4, 0.4, 0.4];

var ambientColor = [0.3, 0.3, 0.3];

var ceilLight_diffuseColor = [1.0, 1.0, 1.0];
var ceilLight_specularColor = [1.0, 1.0, 1.0];
var ceilLight_cutoff = 180;
var ceilLight_position = [0.0, 0.9, 0.0];

var wall_material = new Array(5);
var wall_color = new Array(5);

wall_material[0] = [1.0, 1.0, 1.0, 10.0];
wall_color[0] = [0.2, 0.4, 0.6];
wall_material[1] = [1.0, 1.0, 1.0, 10.0];
wall_color[1] = [0.2, 0.4, 0.6];
wall_material[2] = [1.0, 1.0, 1.0, 10.0];
wall_color[2] = [0.2, 0.4, 0.6];
wall_material[3] = [1.0, 1.0, 1.0, 10.0];
wall_color[3] = [0.2, 0.4, 0.6];
wall_material[4] = [1.0, 1.0, 1.0, 10.0];
wall_color[4] = [0.2, 0.4, 0.6];

var base_material = [1.0, 1.0, 1.0, 10.0];
var base_color = [0.2, 0.4, 0.6];
var base_scale = [0.5, 0.1, 0.5];

var lowerArm_material = [1.0, 1.0, 1.0, 10.0];
var lowerArm_color = [0.2, 0.4, 0.6];
var lowerArm_scale = [0.1, 0.1];

var upperArm_material = [1.0, 1.0, 1.0, 10.0];
var upperArm_color = [0.2, 0.4, 0.6];
var upperArm_scale = [0.1, 0.1];

var lampLight_diffuseColor = [1.0, 1.0, 1.0];
var lampLight_specularColor = [1.0, 1.0, 1.0];


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

function DrawBuffer(){
    this.object = [];
    this.light = [];
    this.draw = function(gl, shader){
        for(var i in this.light){
            this.light[i].draw(gl, shader);
        }
        for(var i in this.object){
            this.object[i].draw(gl, shader);
        }
    }
}

// When Call Draw with Stack that have matrix finished calibration,
// it multiplies own matrix and use it for draw obj,
// then it calls child's draw function with stack.
function HElement(toParent, drawableObj){
    this.toParent = toParent;
    this.Obj = drawableObj;
    this.childs = [];
    this.childCnt = 0;
    this.rotate = new Matrix4();
    this.rotate.setIdentity();
    this.scale = [1.0, 1.0, 1.0];
    this.pushChild = function(HElement, toChild){
        this.childs.push({toChild : toChild, Child : HElement});
        this.childCnt++;
    }
    this.setRotate = function(angle, x, y, z){
        return this.rotate.setRotate(angle, x, y, z);
    }
    this.setScale = function(x, y, z){
        this.scale = [x, y, z];
    }
    this.getTranslate = function(scale, joint, type){
        var mat = new Matrix4();
        if(type == -1)
            mat.setTranslate(-joint[0] * scale[0], -joint[1] * scale[1], -joint[2] * scale[2]);
        else if(type == 1)
            mat.setTranslate(joint[0] * scale[0], joint[1] * scale[1], joint[2] * scale[2]);
        return mat;
    }
    this.set= function(gl, stack, buffer){
        stack.setTop(stack.top()
        .multiply(this.rotate)
        .multiply(this.getTranslate(this.scale, this.toParent, -1)));
    
        if(!this.Obj.set(gl, stack.top()
        .scale(this.scale[0], this.scale[1], this.scale[2]), buffer))
        console.log('Fail to draw Obj');

        for(var i = 0; i<this.childCnt; i++){
            stack.push(stack.top().multiply(this.getTranslate(this.scale, this.childs[i].toChild, 1)));
            this.childs[i].Child.set(gl, stack, buffer);
        }
        stack.pop();
        return true;
    }
}

function Light(index, diffuseColor, specularColor, cutoff){
    this.index = index;
    this.diffuseColor = diffuseColor;
    this.specularColor = specularColor;
    this.cutoff = cutoff;
    this.modelMatrix;
    this.setFlag = false;
    this.l_position;
    this.l_direction;
    this.set = function(gl, modelMatrix, buffer){
        this.setFlag = true;
        this.modelMatrix = modelMatrix;
        var position = new Vector4([0.0, 0.0, 0.0, 1.0]);
        position = new Matrix4(this.modelMatrix).multiplyVector4(position);
        var look_position = new Vector4([0.0, 1.0, 0.0, 1.0]);
        look_position = new Matrix4(this.modelMatrix).multiplyVector4(look_position);
        for(var i=0; i<4; i++)
            look_position.elements[i] -= position.elements[i];

        this.l_position = [position.elements[0], position.elements[1], position.elements[2]];
        this.l_direction= [look_position.elements[0], look_position.elements[1], look_position.elements[2]];
        buffer.light.push(this);
        return true;
    }
    this.draw = function(gl, shader){
        if(!this.setFlag) {
            console.log('Light is not set');
            return false;
        }
        shader.SetMaterial([1.0, 1.0, 1.0]);
        shader.SetLight(this.index, this.diffuseColor, this.specularColor, this.l_position, this.l_direction, this.cutoff);
        return true;
    }
}

function Box(material, color){
    this.color = color;
    this.material = material;
    this.modelMatrix;
    this.setFlag = false;

    this.vertices = new Float32Array([   // Vertex coordinates
        1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
        1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
        -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
        1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
    ]);
    this.normals = new Float32Array([     
        0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  // v0-v1-v2-v3 front(blue)
        1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  // v0-v3-v4-v5 right(green)
        0.0, 0.1, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  // v0-v5-v6-v1 up(red)
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0   // v4-v7-v6-v5 back
    ]);

    this.indices = new Uint8Array([       // Indices of the vertices
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);
    this.vbuffer;
    this.nbuffer;
    this.ibuffer;
    this.set = function(gl, modelMatrix, buffer){
        this.modelMatrix = modelMatrix;
        this.vbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        this.nbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        this.ibuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        this.setFlag = true;
        buffer.object.push(this);
        return true;
    }
    this.draw = function(gl, shader){
        if(!this.setFlag){
            console.log('Box is not set');
            return false;
        }

        var a_Position = initAttrib(gl, this.vbuffer, 'a_Position', gl.FLOAT, 3);
        var a_Normal = initAttrib(gl, this.nbuffer, 'a_Normal', gl.FLOAT, 3);
        var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        gl.vertexAttrib3fv(a_Color, this.color);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
        
        shader.SetMaterial(this.material[0], this.material[1], this.material[2], this.material[3]);
        shader.SetModel(this.modelMatrix);

        // Draw Cube
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_BYTE, 0);

        // Deallocate vertex attribute
        gl.disableVertexAttribArray(a_Position);
        gl.disableVertexAttribArray(a_Normal);
        gl.disableVertexAttribArray(a_Color);

        return true;
    }
}

function Wall(material, color){
    this.color = color;
    this.material = material;
    this.modelMatrix;
    this.setFlag = false;
    
    this.vertices = new Float32Array([
        -1.0, 1.0, 0.0, 
        1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ]);
    this.vbuffer;
    this.set = function(gl, modelMatrix, buffer){
        this.modelMatrix = modelMatrix;

        this.vbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        this.setFlag = true;
        buffer.object.push(this);
        return true;
    }
    this.draw = function(gl, shader){
        var vertexs = new Float32Array([
            -1.0, 1.0, 0.0, 
            1.0, 1.0, 0.0,
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0
        ]);

        var a_Position = initAttrib(gl, this.vbuffer, 'a_Position', gl.FLOAT, 3);
        var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

        gl.vertexAttrib3fv(a_Color, this.color);
        gl.vertexAttrib3fv(a_Normal, [0.0, 0.0, 1.0]);

        shader.SetMaterial(this.material[0], this.material[1], this.material[2], this.material[3]);
        shader.SetModel(this.modelMatrix);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        gl.disableVertexAttribArray(a_Position);
        gl.disableVertexAttribArray(a_Color);
        gl.disableVertexAttribArray(a_Normal);

        return true;
    }
}

function Globe(div, material, color){
    this.div = div;
    this.color = color;
    this.material = material;
    this.modelMatrix;
    this.setFlag = false;
    this.set = function(gl, modelMatrix, buffer){
        this.setFlag = true;
        this.modelMatrix = modelMatrix;
        buffer.object.push(this);
        return true;
    }
    this.draw = function(gl, shader){
        var SPHERE_DIV = this.div;
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
        var a_Position = initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3);
        if(a_Position == -1) return false;
        var a_Normal = initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3);
        if(a_Normal == -1)  return false;
        var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        gl.vertexAttrib3fv(a_Color, this.color);

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
        
        shader.SetMaterial(this.material[0], this.material[1], this.material[2], this.material[3]);
        shader.SetModel(this.modelMatrix);

        // Draw the cube
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        gl.disableVertexAttribArray(a_Position);
        gl.disableVertexAttribArray(a_Normal);
        gl.disableVertexAttribArray(a_Color);

        return true;
    }
} 

function HObject(root){
    this.root = root;
    this.modelMatrix;
    this.setFlag = false;
    this.stack = {
        topCnt : 0,
        data : new Array(100),
        top : function(){return new Matrix4(this.data[this.topCnt]);},
        setTop : function(data){this.data[this.topCnt] = data;},
        pop : function(){this.topCnt--;},
        push : function(data){this.topCnt++; this.setTop(data);},
        clear : function(){this.topCnt = 0;}
    };
    this.set = function(gl, modelMatrix, buffer){
        this.setFlag = true;
        this.modelMatrix = modelMatrix;
        this.stack.clear();
        this.stack.setTop(this.modelMatrix);
        //this.root.setScale(0,0,0);
        this.root.set(gl, this.stack, buffer);
        return true;
    }
}

function Parameters(){
    this.x = 0;
    this.z = 0;
    this.shoulder_1 = 0;
    this.shoulder_2 = 0;
    this.lower = 0;
    this.elbow = 0;
    this.upper = 0;
    this.head_1 = 0;
    this.head_2 = 0;
    this.cutoff = 0;
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

    // Set the clear color and enable the depth test
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);


    // Set Camera
    var PMatrix = new Matrix4();
    PMatrix.setPerspective(cameraAngle, canvas.width/canvas.height, cameraNear, cameraFar);
    shader.SetCamera(PMatrix, lookPoint, centerPoint, cameraUpVector);

    //Document values
    var params = new Parameters();
    setEvent(gl, shader, params);

    drawScene(gl, shader, params);
}

function setEvent(gl, shader, params){
    setParamsEvent(gl, shader, params, 'x');
    setParamsEvent(gl, shader, params, 'z');
    setParamsEvent(gl, shader, params, 'shoulder_1');
    setParamsEvent(gl, shader, params, 'shoulder_2');
    setParamsEvent(gl, shader, params, 'lower');
    setParamsEvent(gl, shader, params, 'elbow');
    setParamsEvent(gl, shader, params, 'upper');
    setParamsEvent(gl, shader, params, 'head_1');
    setParamsEvent(gl, shader, params, 'head_2');
    setParamsEvent(gl, shader, params, 'cutoff');
}

function setParamsEvent(gl, shader, params, id){
    var range = document.getElementById(id);
    var value = document.getElementById(id + '-value');
    value.innerHTML = range.value;
    params[id] = range.value;
    range.oninput = function(){ params[id] = range.value; value.innerHTML = range.value; drawScene(gl, shader, params); }
}

function drawScene(gl, shader, params){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var buffer = new DrawBuffer();
    // Set Model
    var modelMatrix = new Matrix4();  // Model matrix
    modelMatrix.setTranslate(params.x / 100, -1 + lampHeight, params.z / 100); // Rotate around the y-axis
    modelMatrix.scale(lampScale[0], lampScale[1], lampScale[2]);

    setWorld(gl, shader, buffer);
    setLamp(gl, modelMatrix, params, buffer);

    buffer.draw(gl, shader);
}

function setWorld(gl, shader, buffer){
    // Set Lights
    shader.SetAmbient(ambientColor[0], ambientColor[1], ambientColor[2]);

    var ceil_light = new Light(0, ceilLight_diffuseColor, ceilLight_specularColor, ceilLight_cutoff);
    var light_model = new Matrix4();
    light_model.setTranslate(ceilLight_position[0], ceilLight_position[1], ceilLight_position[2]);
    light_model.rotate(180, 1, 0, 0);
    ceil_light.set(gl, light_model, buffer);

    var wall = new Array(5);
    for(var i = 0; i<5; i++)
        wall[i] = new Wall(wall_material[i], wall_color[i]);

    var modelMatrix = new Array(5);
    for(var i = 0; i<5; i++)
        modelMatrix[i] = new Matrix4();
    modelMatrix[0].setTranslate(0, 0, -1);
    modelMatrix[1].setTranslate(1, 0, 0).rotate(-90, 0, 1, 0);
    modelMatrix[2].setTranslate(-1, 0, 0).rotate(90, 0, 1, 0);
    modelMatrix[3].setTranslate(0, 1, 0).rotate(90, 1, 0, 0);
    modelMatrix[4].setTranslate(0, -1, 0).rotate(-90, 1, 0, 0);

    for(var i = 0; i<5; i++){
        wall[i].set(gl, modelMatrix[i], buffer);
    }
}

function setLamp(gl, modelMatrix, params, buffer){
    var root = new HElement([0.0, 0.0, 0.0], new Box(base_material, base_color));
    root.setScale(base_scale[0], base_scale[1], base_scale[2]);
    var lowerArm = new HElement([0.0, -1.0, 0.0], new Box(lowerArm_material, lowerArm_color));
    lowerArm.setScale(lowerArm_scale[0], params.lower/100, lowerArm_scale[1]);
    lowerArm.setRotate((Number)(params.shoulder_1) - 90, 0, 0, 1).
        rotate(params.shoulder_2, 0, 1, 0);
    root.pushChild(lowerArm, [0.0, 1.0, 0.0]);
    var upperArm = new HElement([0.0, -1.0, 0.0], new Box(upperArm_material, upperArm_color));
    upperArm.setScale(upperArm_scale[0], params.upper/100, upperArm_scale[1]);
    upperArm.setRotate(params.elbow, 1, 0, 0);
    lowerArm.pushChild(upperArm, [0.0, 1.0, 0.0]);
    var lamp= new HElement([0.0, -1.0, 0.0], new Globe(80, [1.0, 1.0, 1.0, 10.0], [0.5, 0.3, 0.6]));
    lamp.setScale(0.2, 0.2, 0.2);
    upperArm.pushChild(lamp, [0.0, 1.0, 0.0]);
    var lamp_light = new HElement([0.0, 0.0, 0.0], new Light(1, lampLight_diffuseColor, lampLight_specularColor, params.cutoff));
    lamp.pushChild(lamp_light, [0.0, 1.0, 0.0]);

    var obj = new HObject(root);

    obj.set(gl, modelMatrix, buffer);
}

function initArrayBuffer(gl, attribute, data, type, num) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return -1;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    return a_attribute;
}

function initAttrib(gl, buffer, attribute, type, num){
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
    return a_attribute;
}