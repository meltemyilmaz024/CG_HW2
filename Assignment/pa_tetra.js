"use strict";

var canvas;
var gl;

//for rotate
var rotationMatrix;
var rotationMatrixLoc;
var rotatedX,rotatedY,rotatedZ;

//for scale
var scaleMatrix;
var scaleMatrixLoc;
var scaleValue = [1, 1, 1];

//for translation
var translateMatrix;
var translateMatrixLoc;
var trValue = [0, 0, 0];

var near = 0.3; // near clipping plane
var far = 11.0; // far clipping plane
var eyeX = 0;   // camera position x
var eyeY = 0;   // camera position y
var eyeZ = 3;   // camera position z
var tarX = 0;   // camera target (at) position x
var tarY = 0;   // camera target (at) position y
var tarZ = 0;   // camera target (at) position z

var  fovy = 70.0;  // Field-of-view angle (in degrees)
var  aspect = 1.0; // Viewport aspect ratio

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye = vec3(eyeX, eyeY, eyeZ);   // camera eye vector
var at = vec3(tarX, tarY, tarZ);    // camera at vector
const up = vec3(0.0, 1.0, 0.0);     // camera up vector

//modify this function to initialize the shape
window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    aspect =  canvas.width/canvas.height;

    // Clear the canvas.
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vertexPositionAttrLoc = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vertexPositionAttrLoc);
    var vertexColorAttrLoc = gl.getAttribLocation(program, "vColor");
    gl.enableVertexAttribArray(vertexColorAttrLoc);
    var vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    var vertices = [ 0.0,  1.0, -0.5,
                    -1.0, -0.5, -0.5,
                     1.0, -0.5, -0.5,
                     0.0,  0.0,  1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttrLoc, 3, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    var indices = [0, 1, 2,
                   0, 2, 3,
                   0, 3, 1,
                   2, 1, 3];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    var vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    var colors = [ 1.0,  0.0,  0.0,
                   0.0,  1.0,  0.0,
                   0.0,  0.0,  1.0,
                   1.0,  0.0,  1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexColorAttrLoc, 3, gl.FLOAT, false, 0, 0);

    gl.enable(gl.CULL_FACE);
    
    rotationMatrix = mat4();
    rotationMatrixLoc = gl.getUniformLocation(program, "r");
    gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(rotationMatrix));

    scaleMatrix = mat4();
    scaleMatrixLoc = gl.getUniformLocation(program,"s");
    gl.uniformMatrix4fv(scaleMatrixLoc,false,flatten(scaleMatrix));

    translateMatrix = mat4();
    translateMatrixLoc = gl.getUniformLocation(program,"t");
    gl.uniformMatrix4fv(translateMatrixLoc,false, flatten(translateMatrix));

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );


    // sliders for viewing parameters
    document.getElementById("fovySlider").oninput = function(event) {
        fovy = document.getElementById("fovySlider").value;
    };
    document.getElementById("objRotationXSlider").oninput = function(event){
        rotatedX = document.getElementById("objRotationXSlider").value;
        rotationMatrix = mult(rotationMatrix, rotateX(rotatedX));
    };
    document.getElementById("objRotationYSlider").oninput = function(event){
        rotatedY = document.getElementById("objRotationYSlider").value;
        rotationMatrix = mult(rotationMatrix, rotateY(rotatedY));
    };
    document.getElementById("objRotationZSlider").oninput = function(event){
        rotatedZ = document.getElementById("objRotationZSlider").value;
        rotationMatrix = mult(rotationMatrix, rotateZ(rotatedZ));
    };
    document.getElementById("inp_tarX").onchange = function(event) {
        tarX = document.getElementById("inp_tarX").value;
        at = vec3(tarX, tarY, tarZ);
    };
    document.getElementById("inp_tarY").onchange = function(event) {
        tarY = document.getElementById("inp_tarY").value;
        at = vec3(tarX, tarY, tarZ);
    };
    document.getElementById("inp_tarZ").onchange = function(event) {
        tarZ = document.getElementById("inp_tarZ").value;
        at = vec3(tarX, tarY, tarZ);
    };
    document.getElementById("inp_camX").onchange = function(event) {
        eyeX = document.getElementById("inp_camX").value;
        eye = vec3(eyeX, eyeY, eyeZ);
    };
    document.getElementById("inp_camY").onchange = function(event) {
        eyeY = document.getElementById("inp_camY").value;
        eye = vec3(eyeX, eyeY, eyeZ);
    };
    document.getElementById("inp_camZ").onchange = function(event) {

        eyeZ = document.getElementById("inp_camZ").value;
        eye = vec3(eyeX, eyeY, eyeZ);
    };
    document.getElementById("inp_objX").onchange = function(event) {
        trValue[0] = document.getElementById("inp_objX").value;
         translateMatrix = mult(translateMatrix, translate(trValue[0], trValue[1], trValue[2]));
    };
    document.getElementById("inp_objY").onchange = function(event) {
        trValue[1] = document.getElementById("inp_objY").value;
         translateMatrix = mult(translateMatrix, translate(trValue[0], trValue[1], trValue[2]));
    };
    document.getElementById("inp_objZ").onchange = function(event) {
        trValue[2] = document.getElementById("inp_objZ").value;
         translateMatrix = mult(translateMatrix, translate(trValue[0], trValue[1], trValue[2]));
    };
    document.getElementById("inp_obj_scaleX").onchange = function(event) {
        scaleValue[0] = document.getElementById("inp_obj_scaleX").value;
        scaleMatrix = mult(scaleMatrix, transpose(scalem(scaleValue[0],scaleValue[1],scaleValue[2])));
    };
    document.getElementById("inp_obj_scaleY").onchange = function(event) {
        scaleValue[1] = document.getElementById("inp_obj_scaleY").value;
        scaleMatrix = mult(scaleMatrix, transpose(scalem(scaleValue[0],scaleValue[1],scaleValue[2])));
    };
    document.getElementById("inp_obj_scaleZ").onchange = function(event) {
        scaleValue[2] = document.getElementById("inp_obj_scaleZ").value;
        scaleMatrix = mult(scaleMatrix, transpose(scalem(scaleValue[0],scaleValue[1],scaleValue[2])));
    };

    render();
}

var render = function(){

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(rotationMatrix));

    gl.uniformMatrix4fv(scaleMatrixLoc, false, flatten(scaleMatrix));

    gl.uniformMatrix4fv(translateMatrixLoc, false, flatten(translateMatrix));

    modelViewMatrix = lookAt(eye, at, up);
    //projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );

    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 0);
    requestAnimFrame(render);
}
