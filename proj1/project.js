/*
*This factors are animation params.
*/
var SCALE_STEP = 0.5;
var SCALE_MULTIPLE = 2.0;
var ANGLE_STEP = 150.0;
var VISUALITY_STEP = 2.3;
var START_DISAPP = 1.0;

function animate_param(){
		this.x = 0.0;
		this.y = 0.0;
		this.angle = 0.0;
		this.scale = 0.0;
		this.visuality = 0.0;
		this.start_disapp = 0.0;
}

function main(){
		var canvas = document.getElementById('webgl');
		var gl = getWebGLContext(canvas);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		if(!gl){
				console.log('Failed to get the rendering context for WebGL');
				return;
		}

		if(!initShaders(gl, document.getElementById('vertex_shader').text, document.getElementById('frag_shader').text)){
			console.log('Failed to initialize shaders');				
			return;
		}

		var u_Matrix = gl.getUniformLocation(gl.program, 'u_Matrix');
		if(!u_Matrix){
			console.log('Failed to get the storage location of u_Matrix');
			return;
		}

		var u_Visuality = gl.getUniformLocation(gl.program, 'u_Visuality');
		if(!u_Visuality){
				console.log('Failed to get the storage location of u_Visuality');
				return;
		}
		

		var n = initvertexBuffers(gl);
		if(n<0){
			console.log('Failed to set the positions of the vertices');
			return;
		}

		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		var matrix = new Matrix4();
		var ani_param = new animate_param();

		canvas.onclick = function(){startAnimate(canvas, ani_param)}

		var tick = function(){
				animate(ani_param);
				console.log(ani_param.angle + ', ' + ani_param.scale + ',' + ani_param.visuality);

				matrix.setTranslate(ani_param.x, ani_param.y, 0.0);
				
				var scale = SCALE_MULTIPLE * Math.log(ani_param.scale + 1);
				matrix.scale(scale, scale, 1.0);
				matrix.rotate(ani_param.angle, 0.0, 0.0);
				
				gl.uniformMatrix4fv(u_Matrix, false, matrix.elements);
				gl.uniform1f(u_Visuality, ani_param.visuality);

				gl.clear(gl.COLOR_BUFFER_BIT);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				requestAnimationFrame(tick, canvas);
		}
		tick();
}



function startAnimate(canvas, ani_param){
		ani_param.x = (event.offsetX/canvas.width) * 2 - 1;
		ani_param.y = (1 - (event.offsetY/canvas.height)) * 2 - 1;
		ani_param.angle = 0.0;
		ani_param.scale = 0.0;
		ani_param.visuality = 1.0;
		ani_param.start_disapp = 0.0;
}

var g_last = Date.now();
function animate(ani_param){
	var now = Date.now();
	var elapsed = now - g_last;
	g_last = now;
	ani_param.angle += (ANGLE_STEP * elapsed) / 1000;
	ani_param.angle %= 360;

	ani_param.scale += (SCALE_STEP * elapsed) / 1000;

	ani_param.start_disapp += elapsed / 1000;
	if(ani_param.start_disapp >= START_DISAPP){
		ani_param.visuality -= (VISUALITY_STEP * elapsed) / 1000;
	}
}

function initvertexBuffers(gl){
	var vertices = new Float32Array([
		-0.5, -0.5,  -0.5, 0.5,  0.5, -0.5,  0.5, 0.5
	]);

	var vertexBuffer = gl.createBuffer();
	if(!vertexBuffer){
		console.log('Failed to create the buffer object');
		return -1;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if(a_Position < 0){
			console.log('Failed to get the storage location of a_Position');
			return -1;
	}

	var a_Coord = gl.getAttribLocation(gl.program, 'a_Coord');
	if(a_Coord < 0){
			console.log('Failed to get the stroage location of a_Coord');
			return -1;
	}

	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);

	gl.vertexAttribPointer(a_Coord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Coord);

	return 4;
}
