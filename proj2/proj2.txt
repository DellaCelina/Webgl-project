// Computer Graphics Project#2 by Duck Hyun Ahn, S.No. 2012920033.

// Vertex shader program
var VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'attribute vec4 a_Color;\n' +
'uniform mat4 u_MvMatrix;\n' +
'uniform mat4 u_PMatrix;\n' +
'varying vec4 v_Color;\n' +
'void main() {\n' +
'  gl_Position = u_MvMatrix * u_PMatrix * a_Position;\n' +
'  v_Color = a_Color;\n' +
'}\n';

// Fragment shader program
var FSHADER_SOURCE =
'#ifdef GL_ES\n' +
'precision mediump float;\n' +
'#endif\n' +
'varying vec4 v_Color;\n' +
'void main() {\n' +
'  gl_FragColor = v_Color;\n' +
'}\n';

// Circles attribute
var circle_r = 10.0;
var circle_vertex_num = 80;

// Variables for controll camera
var longi_angle = 0.0;
var lati_angle = 0.0;
var x_step = 1.0;
var y_step = 1.0;

// Distance of Cube drawed in right side
var view_distance = 10;

// Keydown event Callback
function keydown(e, gl, u_MvMatrix, u_PMatrix, canvas){
	if(e.keyCode == 39){	//right
		longi_angle = Number(longi_angle);
		longi_angle += x_step;
		if(longi_angle > 360) longi_angle -= 360.0;
	}
	if(e.keyCode == 37){	//left
		longi_angle = Number(longi_angle);
		longi_angle -= x_step;
		if(longi_angle< 0) longi_angle += 360.0;
	}
	if(e.keyCode == 38){	//up
		lati_angle = Number(lati_angle); 
		lati_angle += y_step; 
		if(lati_angle > 90) lati_angle = 90.0;
	}
	if(e.keyCode == 40){	//down
		lati_angle = Number(lati_angle); 
		lati_angle -= y_step; 
		if(lati_angle < -90) lati_angle = -90.0;;
	}
	Draw(gl, u_MvMatrix, u_PMatrix, canvas);
};

function main() {
	// HTML tag variables
	var canvas = document.getElementById('webgl');
	// input range
	var longi_slider = document.getElementById('longitude_slider');
	var lati_slider = document.getElementById('latitude_slider');
	// text
	var longi_value = document.getElementById('longi_value');
	var lati_value = document.getElementById('lati_value');

	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}

	// Set the clear color and enable the depth test
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	// Get the storage location of u_MvMatrix and u_PMatrix
	var u_MvMatrix = gl.getUniformLocation(gl.program, 'u_MvMatrix');
	if (!u_MvMatrix) {
		console.log('Failed to get the storage location of u_MvMatrix');
		return;
	}

	var u_PMatrix = gl.getUniformLocation(gl.program, 'u_PMatrix');
	if (!u_PMatrix) {
		console.log('Failed to get the storage location of u_PMatrix');
		return;
	}

	// Draw first scene
	Draw(gl, u_MvMatrix, u_PMatrix, canvas);
	
	// Set key event
	document.onkeydown = function(e){
		keydown(e, gl, u_MvMatrix, u_PMatrix, canvas);
		longi_slider.value = longi_angle;
		longi_value.innerHTML = longi_angle;
		lati_slider.value = lati_angle;
		lati_value.innerHTML = lati_angle;
	};

	// Set slider events
	longi_slider.oninput = function(){ 
		longi_angle = longi_slider.value; 
		longi_value.innerHTML = longi_angle;
		Draw(gl, u_MvMatrix, u_PMatrix, canvas);
	}
	lati_slider.oninput = function(){ 
		lati_angle = lati_slider.value;
		lati_value.innerHTML = lati_angle;
		Draw(gl, u_MvMatrix, u_PMatrix, canvas);
	}

	// Set key event of slider not to duplicate key controll
	longi_slider.onkeydown = function(e){return false;};
	lati_slider.onkeydown = function(e){return false;};
	
	/*
	longi_slider.onchange= function(){ 
		longi_angle = longi_slider.value;
		Draw(gl, u_MvMatrix, u_PMatrix, canvas);
	}
	lati_slider.onchange= function(){ 
		lati_angle = lati_slider.value; 
		Draw(gl, u_MvMatrix, u_PMatrix, canvas);
	}
	*/
}

// Paints things
function Draw(gl, u_MvMatrix, u_PMatrix, canvas){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Draw leftside

	// Set view point
	gl.viewport(0, 0, canvas.width/2, canvas.height);

	// Set camera
	var mvMatrix = new Matrix4();
	mvMatrix.setOrtho(-10.0, 10.0, -10.0, 10.0, 0, 30);
	//mvMatrix.setPerspective(80, 1, 1, 30);
	mvMatrix.lookAt(7, 3, 7, 0, 0, 0, 0, 1, 0);
	gl.uniformMatrix4fv(u_MvMatrix, false, mvMatrix.elements);

	DrawObjs(gl, u_PMatrix, 0);

	// Draw rightside

	// Set view point
	gl.viewport(canvas.width/2, 0, canvas.width/2, canvas.height);

	// Set camera
	//mvMatrix.setOrtho(-10.0, 10.0, -10.0, 10.0, 0, 30);
	mvMatrix.setPerspective(30, 1, 1, 30);
	//mvMatrix.lookAt(7, 3, 7, 0, 0, 0, 0, 1, 0);
	// Using transpose instead of lookat func
	mvMatrix.translate(0, 0, -view_distance);
	mvMatrix.rotate(longi_angle, 0, -1, 0);
	mvMatrix.rotate(lati_angle, Math.cos(longi_angle * Math.PI / 180), 0, -Math.sin(longi_angle * Math.PI / 180));
	gl.uniformMatrix4fv(u_MvMatrix, false, mvMatrix.elements);

	DrawObjs(gl, u_PMatrix, 1);
}

// Draw Things; Cube Axe Circle Camera Line
function DrawObjs(gl, u_PMatrix, flag){
	
	var n = DrawCube(gl, u_PMatrix);
	if(n<0){
		console.log('Failed to Draw Cube');
		return;
	}

	n = DrawAxe(gl, u_PMatrix);
	if(n<0){
		console.log('Failed to Draw Axes');
		return;
	}

	if(flag == 0){
		n = DrawCircle(gl, 0, u_PMatrix);
		if(n<0){
			console.log('Failed to Draw Circle1');
			return;
		}
		n = DrawCircle(gl, 1, u_PMatrix);
		if(n<0){
			console.log('Failed to Draw Circle2');
			return;
		}

		n = DrawCameraLine(gl, u_PMatrix);
		if(n<0){
			console.log('Failed to Draw Lines');
			return;
		}
	}
}

/* Draw Circle
	flag
		0: horizontal circle, white
		1: vertical circle, yellow
*/
function DrawCircle(gl, flag, u_PMatrix){
	var angle = Math.PI * 2 / circle_vertex_num;
	var vertices = new Float32Array(circle_vertex_num * 3);

	// Make Circle Vertices
	for(var i = 0; i < circle_vertex_num; i ++){
		var a = circle_r * Math.cos(angle * i);
		var b = circle_r * Math.sin(angle * i);
		if(flag == 0){
			vertices[i * 3] = a;
			vertices[i * 3 + 1] = 0.0;
			vertices[i * 3 + 2] = b;
		}
		else{
			vertices[i * 3] = 0.0;
			vertices[i * 3 + 1] = a;
			vertices[i * 3 + 2] = b;
		}
	}

	// Write the vertex coordinates to the buffer object
	var a_Position = initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position');
	if(a_Position == -1)
		return -1;

	// Send color to shader
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if (a_Color< 0) {
		console.log('Failed to get the storage location of ' + a_Color);
		return -1;
	}

	// Model Matrix branced by flag
	var pMatrix = new Matrix4();
	if(flag == 0){
		// Pass the model view projection matrix to u_MvMatrix
		gl.vertexAttrib4f(a_Color, 1.0, 1.0, 1.0, 1.0);
		pMatrix.setIdentity();
		gl.uniformMatrix4fv(u_PMatrix, false, pMatrix.elements);
	}
	else{
		gl.vertexAttrib4f(a_Color, 1.0, 1.0, 0.4, 1.0);
		pMatrix.setRotate(longi_angle, 0, 1, 0);
		gl.uniformMatrix4fv(u_PMatrix, false, pMatrix.elements);
	}

	// Draw Circle
	gl.drawArrays(gl.LINE_LOOP, 0, circle_vertex_num);

	// Deallocate vertex attribute
	gl.disableVertexAttribArray(a_Position);
	gl.disableVertexAttribArray(a_Color);

	return circle_vertex_num;
}

function DrawCameraLine(gl, u_PMatrix){
	var vertices = new Float32Array([
		0.0, 0.0, 0.0,  
		0.0, circle_r * Math.sin(lati_angle * Math.PI / 180.0), circle_r * Math.cos(lati_angle * Math.PI / 180.0) //camera line
	]);			

	var colors = new Float32Array([
		1.0, 0.4, 1.0,  1.0, 0.4, 1.0  //camera line
	]);

	// Write the vertex coordinates and color to the buffer object
	var a_Position = initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position');
	if(a_Position == -1)
		return -1;

	var a_Color = initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color');
	if(a_Color == -1)
		return -1;

	// Model Matrix
	var pMatrix = new Matrix4();
	pMatrix.setRotate(longi_angle, 0, 1, 0);
	gl.uniformMatrix4fv(u_PMatrix, false, pMatrix.elements);

	// Draw Line
	gl.drawArrays(gl.LINES, 0, 2);

	// Deallocate vertex attribute
	gl.disableVertexAttribArray(a_Position);
	gl.disableVertexAttribArray(a_Color);

	return 2;	//mean true
}

// Three Axe; x y z
function DrawAxe(gl, u_PMatrix){
	var vertices = new Float32Array([
		0.0, 0.0, 0.0,  0.0, 0.0, circle_r, //front line
		//0.0, 0.0, 0.0,  0.0, 0.0, -circle_r, //back line
		0.0, 0.0, 0.0,  0.0, circle_r, 0.0, //up line
		//0.0, 0.0, 0.0,  0.0, -circle_r, 0.0, //down line
		0.0, 0.0, 0.0,  circle_r, 0.0, 0.0, //circle_right line
		//0.0, 0.0, 0.0,  -circle_r, 0.0, 0.0, //left line
	]);			

	var colors = new Float32Array([
		0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  //front line
		//1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  //back line
		0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  //up line
		//1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  //down line
		1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  //right line
		//1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  //left line
	]);

	// Write the vertex coordinates and color to the buffer object
	var a_Position = initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position');
	if(a_Position == -1)
		return -1;

	var a_Color = initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color');
	if(a_Color == -1)
		return -1;

	// Model Matrix
	var pMatrix = new Matrix4();
	pMatrix.setIdentity();
	gl.uniformMatrix4fv(u_PMatrix, false, pMatrix.elements);

	// Draw Lines
	gl.drawArrays(gl.LINES, 0, 6);

	// Deallocate vertex attribute
	gl.disableVertexAttribArray(a_Position);
	gl.disableVertexAttribArray(a_Color);

	return 2;	//mean true
}

function DrawCube(gl, u_PMatrix) {
	// Create a cube
	//    v6----- v5
	//   /|      /|
	//  v1------v0|
	//  | |     | |
	//  | |v7---|-|v4
	//  |/      |/
	//  v2------v3

	var vertices = new Float32Array([   // Vertex coordinates
		1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
		1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
		1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
		-1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
		-1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
		1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
	]);

	var colors = new Float32Array([     // Colors
		0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
		0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
		1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
		1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
		1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
		0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
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
		return -1;

	// Write the vertex coordinates and color to the buffer object
	var a_Position = initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position');
	if(a_Position == -1)
		return -1;

	var a_Color = initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color');
	if(a_Color == -1)
		return -1;

	// Write the indices to the buffer object
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	// ModelMatrix
	var pMatrix = new Matrix4();
	pMatrix.setIdentity();
	gl.uniformMatrix4fv(u_PMatrix, false, pMatrix.elements);

	// Draw Cube
	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

	// Deallocate vertex attribute
	gl.disableVertexAttribArray(a_Position);
	gl.disableVertexAttribArray(a_Color);

	return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
	var buffer = gl.createBuffer();   // Create a buffer object
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
