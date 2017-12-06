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
    this.draw = function(gl, shader, stack){
        stack.setTop(stack.top()
        .multiply(this.rotate)
        .multiply(this.getTranslate(this.scale, this.toParent, -1)));
    
        if(!this.Obj.draw(gl, shader, stack.top()
        .scale(this.scale[0], this.scale[1], this.scale[2])))
        console.log('Fail to draw Obj');

        for(var i = 0; i<this.childCnt; i++){
            stack.push(stack.top().multiply(this.getTranslate(this.scale, this.childs[i].toChild, 1)));
            this.childs[i].Child.draw(gl, shader, stack);
        }
        stack.pop();
    }
}

function Light(index, diffuseColor, specularColor, cutoff){
    this.index = index;
    this.diffuseColor = diffuseColor;
    this.specularColor = specularColor;
    this.cutoff = cutoff;
    this.draw = function(gl, shader, modelMatrix){
        shader.SetMaterial([1.0, 1.0, 1.0]);
        var position = new Vector4([0.0, 0.0, 0.0, 1.0]);
        position = new Matrix4(modelMatrix).multiplyVector4(position);
        var look_position = new Vector4([0.0, 1.0, 0.0, 1.0]);
        look_position = new Matrix4(modelMatrix).multiplyVector4(look_position);
        for(var i=0; i<4; i++)
            look_position.elements[i] -= position.elements[i];

        var l_position = [position.elements[0], position.elements[1], position.elements[2]];
        var l_direction= [look_position.elements[0], look_position.elements[1], look_position.elements[2]];
        console.log(l_position);
        console.log(l_direction);
        shader.SetLight(this.index, this.diffuseColor, this.specularColor, l_position, l_direction, this.cutoff);
    }
}

function Box(material, color){
    this.color = color;
    this.material = material;
    this.draw = function(gl, shader, modelMatrix){
        var vertices = new Float32Array([   // Vertex coordinates
            1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
            1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
            1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
            -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
            -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
            1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
        ]);

        var normals = new Float32Array([     
            0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  // v0-v1-v2-v3 front(blue)
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  // v0-v3-v4-v5 right(green)
            0.0, 0.1, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  // v0-v5-v6-v1 up(red)
            -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
            0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
            0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0   // v4-v7-v6-v5 back
        ]);

        var indices = new Uint8Array([       // Indices of the vertices
            0, 1, 2,   0, 2, 3,    // front
            4, 5, 6,   4, 6, 7,    // right
            8, 9,10,   8,10,11,    // up
            12,13,14,  12,14,15,    // left
            16,17,18,  16,18,19,    // down
            20,21,22,  20,22,23     // back
        ]);

        // Create a buffer object
        var indexBuffer = gl.createBuffer();
        if (!indexBuffer) 
            return false;

         var a_Position = initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3);
        if(a_Position == -1) {
            console.log('Fail to draw box');
            return false;
        }

        var a_Normal = initArrayBuffer(gl, 'a_Normal', normals, gl.FLOAT, 3);
        if(a_Normal == -1) {
            console.log('Fail to draw box');
            return false;
        }

        var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        gl.vertexAttrib3fv(a_Color, this.color);
        // Write the indices to the buffer object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        shader.SetMaterial(this.material[0], this.material[1], this.material[2], this.material[3]);
        shader.SetModel(modelMatrix);

        // Draw Cube
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

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
    this.draw = function(gl, shader, modelMatrix){
        var vertexs = new Float32Array([
            -1.0, 1.0, 0.0, 
            1.0, 1.0, 0.0,
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0
        ]);

        var a_Position = initArrayBuffer(gl, 'a_Position', vertexs, gl.FLOAT, 3);
        if(a_Position == -1) {
            console.log('Fail to draw wall');
            return false;
        }
        var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

        gl.vertexAttrib3fv(a_Color, color);
        gl.vertexAttrib3fv(a_Normal, [0.0, 0.0, 1.0]);

        shader.SetMaterial(this.material[0], this.material[1], this.material[2], this.material[3]);
        shader.SetModel(modelMatrix);

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
    this.draw = function(gl, shader, modelMatrix){
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
        shader.SetModel(modelMatrix);

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
    this.stack = {
        topCnt : 0,
        data : new Array(100),
        top : function(){return new Matrix4(this.data[this.topCnt]);},
        setTop : function(data){this.data[this.topCnt] = data;},
        pop : function(){this.topCnt--;},
        push : function(data){this.topCnt++; this.setTop(data);},
        clear : function(){this.topCnt = 0;}
    };
    this.draw = function(gl, shader, modelMatrix){
        this.stack.clear();
        this.stack.setTop(modelMatrix);
        //this.root.setScale(0,0,0);
        this.root.draw(gl, shader, this.stack);
    }
}

function Parameters(){
    this.x = 0;
    this.z = -50;
    this.shoulder_1 = 30;
    this.shoulder_2 = -30;
    this.lower = 40;
    this.elbow = -60;
    this.upper = 40;
    this.head_1 = 0;
    this.head_2 = 0;
    this.cutoff = 30;
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
    var lookPoint = [0, 0, 5];
    var centerPoint = [0, 0, 0];
    var cameraUpVector = [0, 1, 0];
    PMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
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
    range.oninput = function(){ params[id] = range.value; value.innerHTML = range.value; drawScene(gl, shader, params); }
}

function drawScene(gl, shader, params){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Set Model
    var modelMatrix = new Matrix4();  // Model matrix
    modelMatrix.setTranslate(params.x / 100, -0.95, params.z / 100); // Rotate around the y-axis
    modelMatrix.scale(0.4, 0.4, 0.4);

    drawWorld(gl, shader);
    drawLamp(gl, shader, modelMatrix, params);
}

function drawWorld(gl, shader){
    // Set Lights
    shader.SetAmbient(0.3, 0.3, 0.3);

    var ceil_light = new Light(0, [1.0, 1.0, 1.0], [1.0, 1.0, 1.0], 180);
    var light_model = new Matrix4();
    light_model.setTranslate(0, 0.9, 0);
    light_model.rotate(180, 1, 0, 0);
    ceil_light.draw(gl, shader, light_model);

    var wall = new Array(5);
    wall[0] = new Wall([1.0, 1.0, 1.0, 10.0], [0.4, 0.4, 0.7]);
    wall[1] = new Wall([1.0, 1.0, 1.0, 10.0], [0.4, 0.4, 0.7]);
    wall[2] = new Wall([1.0, 1.0, 1.0, 10.0], [0.4, 0.4, 0.7]);
    wall[3] = new Wall([1.0, 1.0, 1.0, 10.0], [0.4, 0.4, 0.7]);
    wall[4] = new Wall([1.0, 1.0, 1.0, 10.0], [0.4, 0.4, 0.7]);

    var modelMatrix = new Array(5);
    for(var i = 0; i<5; i++)
        modelMatrix[i] = new Matrix4();
    modelMatrix[0].setTranslate(0, 0, -1);
    modelMatrix[1].setTranslate(1, 0, 0).rotate(-90, 0, 1, 0);
    modelMatrix[2].setTranslate(-1, 0, 0).rotate(90, 0, 1, 0);
    modelMatrix[3].setTranslate(0, 1, 0).rotate(90, 1, 0, 0);
    modelMatrix[4].setTranslate(0, -1, 0).rotate(-90, 1, 0, 0);

    for(var i = 0; i<5; i++){
        wall[i].draw(gl, shader, modelMatrix[i]);
    }
}

function drawLamp(gl, shader, modelMatrix, params){
    var root = new HElement([0.0, 0.0, 0.0], new Box([1.0, 1.0, 1.0, 10.0], [0.2, 0.5, 0.3]));
    root.setScale(0.5, 0.1, 0.5);
    var arm1 = new HElement([0.0, -1.0, 0.0], new Box([1.0, 1.0, 1.0, 10.0], [0.3, 0.3, 0.8]));
    arm1.setScale(0.1, params.lower/100, 0.1);
    arm1.setRotate((Number)(params.shoulder_1) - 90, 0, 0, 1).
        rotate(params.shoulder_2, 0, 1, 0);
    root.pushChild(arm1, [0.0, 1.0, 0.0]);
    var arm2 = new HElement([0.0, -1.0, 0.0], new Box([1.0, 1.0, 1.0, 10.0], [0.2, 0.3, 0.9]));
    arm2.setScale(0.1, params.upper/100, 0.1);
    arm2.setRotate(params.elbow, 1, 0, 0);
    arm1.pushChild(arm2, [0.0, 1.0, 0.0]);
    var lamp= new HElement([0.0, -1.0, 0.0], new Globe(80, [1.0, 1.0, 1.0, 10.0], [0.5, 0.3, 0.6]));
    lamp.setScale(0.2, 0.2, 0.2);
    arm2.pushChild(lamp, [0.0, 1.0, 0.0]);
    var lamp_light = new HElement([0.0, 0.0, 0.0], new Light(1, [1.0, 1.0, 1.0], [1.0, 1.0, 1.0], params.cutoff));
    lamp.pushChild(lamp_light, [0.0, 1.0, 0.0]);

    var obj = new HObject(root);

    obj.draw(gl, shader, modelMatrix);
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
