(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.glSlider = factory());
}(this, (function () { 'use strict';

	let vertexBase = function(){
	    return ''+
	    'attribute vec4 a_position; \n'+         // положение прямоугольника?
	    'attribute vec2 a_texcoord; \n'+     // положение текстуры?

	    'uniform mat4 uProjectionMatrix; \n'+          // состояние перехода между слайдами
	    'uniform mat4 uModelViewMatrix; \n'+          // состояние перехода между слайдами
	    'uniform float u_progress; \n'+
	    'uniform float u_time; \n'+              // время
	    // 'uniform vec2  u_mouse; \n'+             // положение курсора мыши в пикселях относительно блока
	    'uniform vec2  u_blockRatio; \n'+         // коэффициенты размеров блока
	    'uniform vec2  u_texRatio0; \n'+      // коэффициенты размеров картинки

	    'varying vec2 uv; \n' +
	    'varying highp vec2 v_texcoord; \n' +
	    'varying vec2 v_position; \n' +
	    'varying float v_progress; \n'+          // состояние перехода между слайдами
	    'varying float v_time; \n'+              // время
	    // 'varying vec2  v_mouse; \n'+             // положение курсора мыши [0...1], меняется центр координат


	    'void main() { \n'+

	        'uv = vec2( a_texcoord.x , ( 1. - a_texcoord.y) );\n' +
	        'vec2 vUv = (( uv - 0.5 ) / u_blockRatio.xy / u_texRatio0.xy ) +  0.5;\n' +

	        'v_texcoord = vUv;' +
	        'v_position = a_position.xy;' +
	        'v_progress = u_progress; \n'+
	        // 'v_time = u_time; \n'+
	        'gl_Position = uProjectionMatrix * uModelViewMatrix * a_position;' +
	    '}'
	};

	let fragmentBase = function(effects){
	    // console.log(effects);
	    return '' +
	    '#ifdef GL_ES \n' +
	    'precision mediump float; \n' +
	    '#endif \n' +

	    'uniform highp sampler2D uSampler0; \n' +
	    'uniform highp sampler2D uSampler1; \n' +

	    'varying vec2 uv; \n' +
	    'varying highp vec2 v_texcoord; \n' +
	    'varying vec2 v_position; \n' +
	    'varying float v_progress; \n'+          // состояние перехода между слайдами
	    'varying float v_time; \n'+              // время
	    // 'varying vec2  v_mouse; \n'+             // положение курсора мыши [0...1], меняется центр координат

	    effects.filter.function +
	    effects.slide.main +

	    'void main(void) { \n' +
	        // 'gl_FragColor = vec4(0.9, 0.5, 0.5, 1.0); \n' +
	        // 'gl_FragColor = vec4( v_texcoord , 0.5, 1.0); \n' +
	        // 'gl_FragColor = texture2D(u_image0, vec2(v_texcoord.s, v_texcoord.t)); \n' +
	        // 'gl_FragColor = texture2D(uSampler0, v_texcoord ); \n' +

	        'vec4 drawColor = vec4(0.5, 0.5, 0.5, 1.0); \n' +
	        effects.slide.draw + // тут результат эффетка перехода записывается в drawColor
	        'gl_FragColor = filter( drawColor ); \n' +

	    '}'
	};

	let fragmentFilterBase = function(){
	    return {
	        function: ''+
	        'vec4 filter(vec4 color) { \n' +
	            'return color; \n' +
	        '} \n'
	    }
	};

	let fragmentFilterMonochrome = function(){
	    return {
	        function: ''+
	        'vec4 filter(vec4 color) { \n' +
	            'float middle = ( 3.*color.r + 6.*color.g + color.b )/10.; \n' +
	            'color = vec4(middle, middle, middle, 1.); \n' +
	            'return color; \n' +
	        '} \n'
	    }
	};

	let fragmentFilterSepia = function(){
	    return {
	        function: ''+
	        'vec4 filter(vec4 color) { \n' +
	            'vec4 origin = color; \n' +
	            'color.r = origin.r*0.393 + origin.g*0.769 + origin.b*0.189; \n' +
	            'color.g = origin.r*0.349 + origin.g*0.686 + origin.b*0.168; \n' +
	            'color.b = origin.r*0.272 + origin.g*0.534 + origin.b*0.131; \n' +
	            'return color; \n' +
	        '} \n'
	    }
	};

	let fragmentFilterNegative = function(){
	    return {
	        function: ''+
	        'vec4 filter(vec4 color) { \n' +
	            'color = vec4(1.-color.r, 1.-color.g, 1.-color.b, 1.); \n' +
	            'return color; \n' +
	        '} \n'
	    }
	};

	let fragmentSlideBase = function(isIdle){
	    isIdle = ( typeof isIdle === 'undefined') ? false : isIdle;
	    return {
	        main: '',
	        draw:  ''+
	        ( (isIdle)
	                ? 'vec4 colorCurr = idle(u_image0, v_texcoord); \n' +
	                'vec4 colorNext = idle(u_image1, v_texcoord); \n'
	                : ''+
	                'vec4 colorCurr = texture2D(uSampler0, v_texcoord); \n' +
	                'vec4 colorNext = texture2D(uSampler1, v_texcoord); \n'
	        ) +
	        'drawColor = colorCurr * (1. - v_progress) + colorNext * v_progress; \n'
	    }
	};

	let fragmentSlideWave = function(isIdle){
	    isIdle = ( typeof isIdle === 'undefined') ? false : isIdle;
	    return {
	        main: '' +
	        'vec2 mirrored(vec2 v) { \n' +
	            'vec2 m = mod(v,2.); \n' +
	            'return mix(m,2.0 - m, step(1.0 ,m)); \n' +
	        '} \n' +

	        'float tri(float p) { \n' +
	            'return mix(p,1.0 - p, step(0.5 ,p))*2.; \n' +
	        '} \n',
	        draw: ''+


	        'vec2 accel = vec2(0.5,2); \n' +

	        // 'vec2 uv = v_texcoord; \n' +
	        'vec2 uv = gl_FragCoord.xy/vec2(974.); \n' +

	        'float p = fract(v_progress); \n' +

	        'float delayValue = p*7. - uv.y*2. + uv.x - 2.; \n' +

	        'delayValue = clamp(delayValue,0.,1.); \n' +

	        'vec2 translateValue = p + delayValue*accel; \n' +
	        'vec2 translateValue1 = vec2(-0.5,1.)* translateValue; \n' +
	        'vec2 translateValue2 = vec2(-0.5,1.)* (translateValue - 1. - accel); \n' +

	        'vec2 w = sin( sin(v_time)*vec2(0,0.3) + v_texcoord.yx*vec2(0,4.))*vec2(0,0.5); \n' +
	        'vec2 xy = w*(tri(p)*0.5 + tri(delayValue)*0.5); \n' +

	        'vec2 uv1 = v_texcoord + translateValue1 + xy; \n' +
	        'vec2 uv2 = v_texcoord + translateValue2 + xy; \n' +

	        'vec4 rgba1 = texture2D(uSampler0,mirrored(uv1)); \n' +
	        'vec4 rgba2 = texture2D(uSampler1,mirrored(uv2)); \n' +

	        'vec4 rgba = mix(rgba1,rgba2,delayValue); \n' +
	        'drawColor = rgba; \n'
	    }
	};

	let fragmentSlideZoomBlur = function(isIdle){
	    isIdle = ( typeof isIdle === 'undefined') ? false : isIdle;
	    return {
	        main: ''+
	        'float random(vec3 scale, float seed) { \n' +
	            'return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758. + seed); \n' +
	        '} \n' +

	        'vec4 slide(sampler2D image, vec2 textureCoord, float progress) { \n' +
	            'vec4 color = vec4(0.0); \n' +
	            'float total = 0.0; \n' +
	            'float strength = 20. * progress; \n' +
	            'vec2  center = vec2(0.5); \n' +
	            'vec2 toCenter = center - v_texcoord; \n' +
	            'float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0); \n' +
	            'float texSize = 20.; \n' +

	            'for (float t = 0.0; t <= 40.0; t++) { \n' +
	                'float percent = (t + offset) / 40.0; \n' +
	                'float weight = 4.0 * (percent - percent * percent); \n' +
	                'vec4 sample = texture2D(image, v_texcoord + toCenter * percent * strength / texSize); \n' +
	                'sample.rgb *= sample.a; \n' +
	                'color += sample * weight; \n' +
	                'total += weight; \n' +
	            '} \n' +

	            'return color / total; \n' +
	        '} \n',
	        draw: ''+
	        'vec4 colorCurr = slide(uSampler0, v_texcoord, v_progress); \n' +
	        'vec4 colorNext = slide(uSampler1, v_texcoord, 1. - v_progress); \n' +

	        'drawColor = colorCurr*(1. - v_progress) + colorNext*v_progress; \n'
	    }
	};

	let fragmentSlideFragmentparalax = function(isIdle){
	    isIdle = ( typeof isIdle === 'undefined') ? false : isIdle;
	    return {
	        main: '' +
	        'vec4 slide(sampler2D image, vec2 textureCoord, vec2 position, float progress, vec2 vUv1, float dir, float second) { \n' +
	            'float dx = progress*0.8; \n' +
	            'float vert = abs(progress*0.3); \n' +
	            'dx -= step(0.2 - second*vert,position.x/2.)*0.3*progress; \n' +
	            'dx -= step(0.4 - second*vert,position.x/2.)*0.3*progress; \n' +
	            'dx += step(0.6 - second*vert,position.x/2.)*0.3*progress; \n' +
	            'dx += step(0.8 - second*vert,position.x/2.)*0.3*progress; \n' +
	            'vec4 tex = texture2D(image,vec2(vUv1.x + second*dx,vUv1.y)); \n' +
	            'float bounds = step(0., 1. - (textureCoord.x/2. + second*progress))*step(0., textureCoord.x/2. + second*progress); \n' +

	            'return tex*bounds; \n' +
	        '} \n',
	        draw:  ''+
	        'vec2 uv = v_texcoord; \n' +

	        'vec2 vUv = uv; \n' +
	        'vec2 _uv = uv - 0.5; \n' +
	        'vec2 vUv1 = _uv; \n' +
	        'vUv1 *= vec2(1., 1.); \n' +
	        'vUv1 += 0.5; \n' +

	        'vec2 position = step(0.,v_progress)*uv + step(0.,-v_progress)*(1. - uv); \n' +

	        'vec4 colorCurr = slide(uSampler0, v_texcoord, position, v_progress, vUv1, 1., 1.); \n' +
	        'vec4 colorNext = slide(uSampler1, v_texcoord, position, 1. - v_progress, vUv1, 1., -1.); \n' +
	        'drawColor = colorCurr + colorNext; \n'
	    }
	};

	// Vertex base shader


	let shaders = {
	    vertex: {
	        base: vertexBase
	    },
	    fragment: {
	        base: fragmentBase,
	        filters: {
	            base: fragmentFilterBase,
	            monochrome: fragmentFilterMonochrome,
	            negative: fragmentFilterNegative,
	            sepia: fragmentFilterSepia
	        },
	        slide: {
	            base: fragmentSlideBase,
	            fragmentParalax: fragmentSlideFragmentparalax,
	            wave: fragmentSlideWave,
	            zoomBlur: fragmentSlideZoomBlur
	        }
	    }
	};

	/**
	 * @fileoverview gl-matrix - High performance matrix and vector operations
	 * @author Brandon Jones
	 * @author Colin MacKenzie IV
	 * @version 2.7.0
	 */

	/* Copyright (c) 2015-2018, Brandon Jones, Colin MacKenzie IV.
	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
	documentation files (the "Software"), to deal in the Software without restriction, including without limitation
	the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
	to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of
	the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
	THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL T
	HE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
	TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
	IN THE SOFTWARE. */

	let glMatrix = {
	    EPSILON: 0.000001,
	    ARRAY_TYPE: (typeof Float32Array !== 'undefined') ? Float32Array : Array
	};

	/**
	 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
	 * @module mat4
	 */

	/**
	 * Creates a new identity mat4
	 *
	 * @returns {mat4} a new 4x4 matrix
	 */
	function create() {
	    let out = new glMatrix.ARRAY_TYPE(16);
	    if(glMatrix.ARRAY_TYPE != Float32Array) {
	        out[1] = 0;
	        out[2] = 0;
	        out[3] = 0;
	        out[4] = 0;
	        out[6] = 0;
	        out[7] = 0;
	        out[8] = 0;
	        out[9] = 0;
	        out[11] = 0;
	        out[12] = 0;
	        out[13] = 0;
	        out[14] = 0;
	    }
	    out[0] = 1;
	    out[5] = 1;
	    out[10] = 1;
	    out[15] = 1;
	    return out;
	}

	/**
	 * Translate a mat4 by the given vector
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to translate
	 * @param {vec3} v vector to translate by
	 * @returns {mat4} out
	 */
	function translate(out, a, v) {
	    let x = v[0], y = v[1], z = v[2];
	    let a00, a01, a02, a03;
	    let a10, a11, a12, a13;
	    let a20, a21, a22, a23;

	    if (a === out) {
	        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
	        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
	        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
	        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
	    } else {
	        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
	        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
	        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

	        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
	        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
	        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

	        out[12] = a00 * x + a10 * y + a20 * z + a[12];
	        out[13] = a01 * x + a11 * y + a21 * z + a[13];
	        out[14] = a02 * x + a12 * y + a22 * z + a[14];
	        out[15] = a03 * x + a13 * y + a23 * z + a[15];
	    }

	    return out;
	}

	/**
	 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to scale
	 * @param {vec3} v the vec3 to scale the matrix by
	 * @returns {mat4} out
	 **/
	function scale(out, a, v) {
	    let x = v[0], y = v[1], z = v[2];

	    out[0] = a[0] * x;
	    out[1] = a[1] * x;
	    out[2] = a[2] * x;
	    out[3] = a[3] * x;
	    out[4] = a[4] * y;
	    out[5] = a[5] * y;
	    out[6] = a[6] * y;
	    out[7] = a[7] * y;
	    out[8] = a[8] * z;
	    out[9] = a[9] * z;
	    out[10] = a[10] * z;
	    out[11] = a[11] * z;
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	}

	/**
	 * Rotates a mat4 by the given angle around the given axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @param {vec3} axis the axis to rotate around
	 * @returns {mat4} out
	 */
	function rotate(out, a, rad, axis) {
	    let x = axis[0], y = axis[1], z = axis[2];
	    let len = Math.sqrt(x * x + y * y + z * z);
	    let s, c, t;
	    let a00, a01, a02, a03;
	    let a10, a11, a12, a13;
	    let a20, a21, a22, a23;
	    let b00, b01, b02;
	    let b10, b11, b12;
	    let b20, b21, b22;

	    if (len < glMatrix.EPSILON) { return null; }

	    len = 1 / len;
	    x *= len;
	    y *= len;
	    z *= len;

	    s = Math.sin(rad);
	    c = Math.cos(rad);
	    t = 1 - c;

	    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
	    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
	    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

	    // Construct the elements of the rotation matrix
	    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
	    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
	    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

	    // Perform rotation-specific matrix multiplication
	    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
	    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
	    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
	    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
	    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
	    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
	    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
	    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
	    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
	    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
	    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
	    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

	    if (a !== out) { // If the source and destination differ, copy the unchanged last row
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }
	    return out;
	}

	/**
	 * Generates a perspective projection matrix with the given bounds.
	 * Passing null/undefined/no value for far will generate infinite projection matrix.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} fovy Vertical field of view in radians
	 * @param {number} aspect Aspect ratio. typically viewport width/height
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum, can be null or Infinity
	 * @returns {mat4} out
	 */
	function perspective(out, fovy, aspect, near, far) {
	    let f = 1.0 / Math.tan(fovy / 2), nf;
	    out[0] = f / aspect;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = f;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[11] = -1;
	    out[12] = 0;
	    out[13] = 0;
	    out[15] = 0;
	    if (far != null && far !== Infinity) {
	        nf = 1 / (near - far);
	        out[10] = (far + near) * nf;
	        out[14] = (2 * far * near) * nf;
	    } else {
	        out[10] = -1;
	        out[14] = -2 * near;
	    }
	    return out;
	}

	/**
	 * Initialize WebGl context
	 * @param {*} canvas html canvas element
	 */
	function initGL(canvas) {
	    let gl;
	    try {
	        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	    } catch (error) {
	        let msg = "Error creating WebGL context: " + error.toString();
	        throw Error(msg);
	    }
	    if (!gl) {
	        console.warn('webgl not work!');
	        return null;
	    }

	    return gl;
	}

	/**
	 * Initialize a shader program, so WebGL knows how to draw our data
	 * @param {WebGLRenderingContext} gl web
	 * @param {string} vertexShaderSource
	 * @param {string} fragmentShaderSource
	 * @returns {*|WebGLProgram}
	 */
	function initShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {
	    let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	    let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	    // Create the shader program
	    let shaderProgram = gl.createProgram();
	    gl.attachShader(shaderProgram, vertexShader);
	    gl.attachShader(shaderProgram, fragmentShader);
	    gl.linkProgram(shaderProgram);

	    // If creating the shader program failed, alert
	    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	        throw ('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
	    }

	    return {
	        program: shaderProgram,
	        attribLocations: {
	            vertexPosition: gl.getAttribLocation(shaderProgram, 'a_position'),
	            textureCoord: gl.getAttribLocation(shaderProgram, 'a_texcoord')
	        },
	        uniformLocations: {
	            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
	            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
	            progress: gl.getUniformLocation(shaderProgram, 'u_progress'),
	            image0: gl.getUniformLocation(shaderProgram, 'uSampler0'),
	            image1: gl.getUniformLocation(shaderProgram, 'uSampler1'),
	            sizeRatio: gl.getUniformLocation(shaderProgram, 'u_blockRatio'),
	            textureRatio0: gl.getUniformLocation(shaderProgram, 'u_texRatio0'),
	            textureRatio1: gl.getUniformLocation(shaderProgram, 'u_texRatio1')
	        }
	    };
	}

	/**
	 * Creates a shader of the given type, uploads the source and compiles it.
	 * @param {WebGLRenderingContext} gl
	 * @param type WebGLShaderType
	 * @param source WebGLShaderSource
	 * @returns {*|WebGLShader}
	 */
	function loadShader(gl, type, source) {
	    let shader = gl.createShader(type);

	    // Send the source to the shader object
	    gl.shaderSource(shader, source);

	    // Compile the shader program
	    gl.compileShader(shader);

	    // See if it compiled successfully
	    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	        throw ('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
	    }

	    return shader;
	}

	/**
	 * Combine fragment shader code
	 * @returns {*} Fragment shader code
	 */
	function combineFragmentShader(effects) {
	    let filter = null,
	        slide = null;

	    if (shaders.fragment.filters.hasOwnProperty(effects.filter)) {
	        filter = shaders.fragment.filters[effects.filter]();
	    } else {
	        throw ('glslSlider: filter effect ' + effects.filter + ' not found');
	    }

	    if (shaders.fragment.slide.hasOwnProperty(effects.slide)) {
	        slide = shaders.fragment.slide[effects.slide]();
	    } else {
	        throw ('glslSlider: slide effect ' + effects.slide + ' not found');
	    }

	    return shaders.fragment.base({
	        isIdle: true,
	        filter: filter,
	        slide: slide
	    });
	}

	function initBuffers(gl, geometrySize) {
	    let positionBuffer = gl.createBuffer();
	    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	    function generateVertexPosition(sizeX, sizeY) {
	        let position = [];
	        let axis = {
	            x: {
	                min: -1.0,
	                max: 1.0
	            },
	            y: {
	                min: -1.0,
	                max: 1.0
	            }
	        };

	        axis.x.length = axis.x.max - axis.x.min;
	        axis.y.length = axis.y.max - axis.y.min;

	        axis.x.step = axis.x.length / sizeX;
	        axis.y.step = axis.y.length / sizeY;

	        for (let y = sizeY - 1; y >= 0; y--) {
	            for (let x = 0; x < sizeX; x++) {
	                let array = [
	                    axis.x.min + (x * axis.x.step), axis.y.min + (y * axis.y.step), 1.0,
	                    axis.x.min + ((x + 1) * axis.x.step), axis.y.min + (y * axis.y.step), 1.0,
	                    axis.x.min + ((x + 1) * axis.x.step), axis.y.min + ((y + 1) * axis.y.step), 1.0,
	                    axis.x.min + (x * axis.x.step), axis.y.min + ((y + 1) * axis.y.step), 1.0
	                ];
	                position = position.concat(array);
	            }
	        }

	        return position;
	    }

	    let positions = generateVertexPosition(geometrySize.x, geometrySize.y);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	    let textureCoordBuffer = gl.createBuffer();
	    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

	    function generateTextureCoord(sizeX, sizeY) {
	        let coords = [];
	        let axis = {
	            x: {
	                min: 0.0,
	                max: 1.0
	            },
	            y: {
	                min: 0.0,
	                max: 1.0
	            }
	        };

	        axis.x.length = axis.x.max - axis.x.min;
	        axis.y.length = axis.y.max - axis.y.min;

	        axis.x.step = axis.x.length / sizeX;
	        axis.y.step = axis.y.length / sizeY;

	        for (let y = sizeY - 1; y >= 0; y--) {
	            for (let x = 0; x < sizeX; x++) {
	                let array = [
	                    axis.x.min + (x * axis.x.step), axis.y.min + (y * axis.y.step),
	                    axis.x.min + ((x + 1) * axis.x.step), axis.y.min + (y * axis.y.step),
	                    axis.x.min + ((x + 1) * axis.x.step), axis.y.min + ((y + 1) * axis.y.step),
	                    axis.x.min + (x * axis.x.step), axis.y.min + ((y + 1) * axis.y.step)
	                ];
	                coords = coords.concat(array);
	            }
	        }

	        return coords;
	    }

	    let textureCoordinates = generateTextureCoord(geometrySize.x, geometrySize.y);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

	    let indexBuffer = gl.createBuffer();
	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

	    function generateIndices(sizeX, sizeY) {
	        let indices = [];

	        for (let i = 0; i < sizeX * sizeY; i++) {
	            let curr = 4 * i;
	            let array = [
	                curr, curr + 1, curr + 2, curr, curr + 2, curr + 3
	            ];
	            indices = indices.concat(array);
	        }

	        return indices;
	    }

	    let indices = generateIndices(geometrySize.x, geometrySize.y);
	    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	    return {
	        position: positionBuffer,
	        textureCoord: textureCoordBuffer,
	        indices: indexBuffer
	    };
	}

	function loadTexture(gl, url, index, callback) {
	    let texture = gl.createTexture();
	    gl.bindTexture(gl.TEXTURE_2D, texture);

	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

	    let image = new Image();
	    let _ratio = {
	        x: 1,
	        y: 1
	    };
	    image.onload = function () {
	        gl.bindTexture(gl.TEXTURE_2D, texture);
	        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
	            gl.generateMipmap(gl.TEXTURE_2D);
	        } else {
	            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	        }


	        if (image.naturalWidth > image.naturalHeight) {
	            _ratio.x = image.naturalWidth / image.naturalHeight;
	        } else {
	            _ratio.y = image.naturalHeight / image.naturalWidth;
	        }

	        callback('done');
	    };
	    image.onerror = function () {
	        throw ('glslSlider: cannot load image ' + url);
	    };
	    if (url.origin !== window.location.origin) {
	        image.crossOrigin = "";
	    }
	    image.src = url;

	    return {
	        index: index,
	        type: 'img',
	        size: [image.naturalWidth, image.naturalHeight],
	        ratio: _ratio,
	        texture: texture
	    };
	}

	function isPowerOf2(value) {
	    return (value & (value - 1)) === 0;
	}

	/**
	 * Calculate size and proportions of canvas
	 */
	function resize(gl, variables) {
	    let width = gl.canvas.clientWidth;
	    let height = gl.canvas.clientHeight;
	    if (gl.canvas.width !== width || gl.canvas.height !== height) {

	        gl.canvas.width = width;
	        gl.canvas.height = height;

	        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

	        variables.canvasSize.width = gl.canvas.clientWidth;
	        variables.canvasSize.height = gl.canvas.clientHeight;

	        if (variables.canvasSize.width >= variables.canvasSize.height) {
	            variables.canvasRatio.width = 1;
	            variables.canvasRatio.height = variables.canvasSize.width / variables.canvasSize.height;
	        } else {
	            variables.canvasRatio.height = 1;
	            variables.canvasRatio.width = variables.canvasSize.height / variables.canvasSize.width;
	        }
	    }
	}

	function drawScene(gl, items, itemActive, geometrySize, variables, programInfo, buffers) {

	    resize(gl, variables);

	    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
	    gl.clearDepth(1.0);                 // Clear everything
	    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
	    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

	    gl.enable(gl.BLEND);
	    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	    // Clear the canvas before we start drawing on it.
	    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	    let fieldOfView = 48 * Math.PI / 180;   // in radians
	    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	    let zNear = 0.1;
	    let zFar = 100.0;
	    let projectionMatrix = create();

	    // note: glmatrix.js always has the first argument as the destination to receive the result.
	    perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

	    // Set the drawing position to the "identity" point, which is the center of the scene.
	    let modelViewMatrix = create();
	    let planeRotation = 0.0;
	    // Now move the drawing position a bit to where we want to start drawing the square.
	    translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -3.2]);           // amount to translate
	    rotate(modelViewMatrix, modelViewMatrix, planeRotation, [0, 0, 1]);       // axis to rotate around (Z)
	    rotate(modelViewMatrix, modelViewMatrix, planeRotation * .7, [0, 1, 0]);  // axis to rotate around (X)

	    // Scale along axis X
	    let koefX = gl.canvas.clientWidth / gl.canvas.clientHeight;
	    scale(modelViewMatrix, modelViewMatrix, [koefX, 1, 1]);

	    // Tell WebGL how to pull out the positions from the position
	    // buffer into the vertexPosition attribute
	    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
	    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

	    // Tell WebGL how to pull out the texture coordinates from
	    // the texture coordinate buffer into the textureCoord attribute.
	    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
	    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false,  0,  0);
	    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

	    // Tell WebGL which indices to use to index the vertices
	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

	    // Tell WebGL to use our program when drawing
	    gl.useProgram(programInfo.program);

	    // Set the shader uniforms
	    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
	    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

	    // Specify the texture to map onto the faces.
	    gl.uniform1i(programInfo.uniformLocations.image0, 0);
	    gl.uniform1i(programInfo.uniformLocations.image1, 1);

	    gl.uniform2f(programInfo.uniformLocations.textureRatio0, items[itemActive].ratio.x, items[itemActive].ratio.y);
	    gl.uniform1f(programInfo.uniformLocations.progress, variables.progress);
	    gl.uniform2f(programInfo.uniformLocations.textureRatio0,  items[itemActive].ratio.x, items[itemActive].ratio.y);
	    gl.uniform2f(programInfo.uniformLocations.sizeRatio, variables.canvasRatio.width, variables.canvasRatio.height);

	    gl.drawElements(gl.TRIANGLES, geometrySize.x * geometrySize.y * 6, gl.UNSIGNED_SHORT, 0);
	}

	/**
	 * Add handlers
	 */
	function addHandlersCanvas(el, variables) {
	    addHandlerOnMouseEnter(el, variables);
	    addHandlerOnMouseOut(el, variables);
	    addHandlerOnMouseMove(el, variables);
	}

	function addHandlerOnMouseEnter(el, variables) {
	    el.addEventListener('mouseenter', function(e){
	        variables.mouse.state = 'enter';
	        variables.mouse.x = e.offsetX;
	        variables.mouse.y = e.offsetY;
	    });
	}

	function addHandlerOnMouseOut(el, variables) {
	    el.addEventListener('mouseout', function(e){
	        variables.mouse.state = 'out';
	        variables.mouse.x = e.offsetX;
	        variables.mouse.y = e.offsetY;
	    });
	}

	function addHandlerOnMouseMove(el, variables) {
	    el.addEventListener('mousemove', function(e){
	        variables.mouse.state = 'enter';
	        variables.mouse.x = e.offsetX;
	        variables.mouse.y = e.offsetY;
	    });
	}

	function addHandlersNavigationArrows(arrows) {
	    arrows.prev.addEventListener('click', function(){
	        arrows.prevAction();
	    });
	    arrows.next.addEventListener('click', function(){
	        arrows.nextAction();
	    });
	}

	function addHandlersNavigationDots(btn, callback) {
	    btn.addEventListener('click', function(){
	        callback();
	    });
	}

	const blockClass = 'gl-slider';

	/**
	 * Create canvas, append to DOM and add events listeners
	 */
	function createCanvas(rootEl) {
	    let canvas = document.createElement('canvas');
	    rootEl.appendChild(canvas);


	    return canvas;
	}

	function createPreloader(rootEl) {
	    let preloader = document.createElement('div');
	    preloader.classList.add(blockClass + '__preloader');

	    let spinner = document.createElement('div');
	    spinner.classList.add(blockClass + '__preloader-spinner');

	    preloader.appendChild(spinner);
	    rootEl.appendChild(preloader);

	    return preloader;
	}

	function removePreloader(el) {
	    el.remove();
	}

	/**
	 * Create Arrows, append to DOM and add events listeners
	 */
	function createArrows(rootEl) {
	    let arrows = document.createElement('div');
	    arrows.classList.add(blockClass + '__arrows');

	    let arrowNext = document.createElement('button');
	    arrowNext.classList.add(blockClass + '__arrows-btn');
	    arrowNext.classList.add('-next');
	    arrowNext.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="10 18 16 12 10 6"></polyline></svg>';

	    let arrowPrev = document.createElement('button');
	    arrowPrev.classList.add(blockClass + '__arrows-btn');
	    arrowPrev.classList.add('-prev');
	    arrowPrev.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="14 18 8 12 14 6"></polyline></svg>';

	    arrows.appendChild(arrowPrev);
	    arrows.appendChild(arrowNext);
	    rootEl.appendChild(arrows);

	    return {
	        prev: arrowPrev,
	        next: arrowNext
	    };
	}

	/**
	 * Create Dots, append to DOM and add events listeners
	 */
	function createDots(rootEl, items, itemActive) {
	    let dots = document.createElement('div');
	    dots.classList.add(blockClass + '__dots');

	    for (let i = 0; i < items.length; i++) {
	        let dot = document.createElement('button');
	        dot.classList.add(blockClass + '__dot');
	        if (i === itemActive) {
	            dot.classList.add('is-active');
	        }
	        dot.setAttribute('data-dot-number', i.toString());
	        dot.innerHTML = 'i';
	        addHandlersNavigationDots(dot, i);
	        dots.appendChild(dot);
	    }

	    rootEl.appendChild(dots);

	    return dots;
	}

	/**
	 * Simple object check.
	 * @param item
	 * @returns {boolean}
	 */
	function isObject(item) {
	    return (item && typeof item === 'object' && !Array.isArray(item));
	}

	/**
	 * Deep merge two objects.
	 * @param target
	 * @param ...sources
	 */
	function mergeDeep(target, ...sources) {
	    if (!sources.length) return target;
	    const source = sources.shift();

	    if (isObject(target) && isObject(source)) {
	        for (const key in source) {
	            if (isObject(source[key])) {
	                if (!target[key]) Object.assign(target, {
	                    [key]: {}
	                });
	                mergeDeep(target[key], source[key]);
	            } else {
	                Object.assign(target, {
	                    [key]: source[key]
	                });
	            }
	        }
	    }

	    return mergeDeep(target, ...sources);
	}

	/**
	 * @fileoverview gl-slider is a easy to use slider with awesome transition effects, which use glsl shaders. 
	 * @author Andrey Kozlov
	 * @version 0.0.4
	 */

	class webglSlider {

	    constructor(rootEl, options) {


	        this.defaults = {
	            effects: {
	                filter: 'base',
	                slide: 'base'
	            },
	            animationSpeed: 500,
	            arrows: true,
	            dots: false,
	            autoplay: false,
	            autoplaySpeed: 3000,
	            preloader: true,
	            startItem: 0,
	            renderInView: false // render only when slider visible
	        };
	        this.html = {
	            root: rootEl,
	            canvas: null,
	            preloader: null,
	            arrows: null,
	            dots: null
	        };
	        this.geometrySize = {
	            x: 1,
	            y: 1
	        };
	        this.items = [];
	        this.variables = {
	            progress: 0,
	            time: 0,
	            canvasSize: {
	                width: 0,
	                height: 0
	            },
	            canvasRatio: {
	                width: 1,
	                height: 1
	            },
	            texRatio0: {
	                width: 1,
	                height: 1
	            },
	            texRatio1: {
	                width: 1,
	                height: 1
	            },
	            mouse: {
	                state: 'out',
	                x: 0,
	                y: 0
	            }
	        };
	        this.options = mergeDeep(this.defaults, options);
	        this.animate = {
	            isActive: false,
	            currTime: 0,
	            totalTime: this.options.animationSpeed
	        };
	        this.onView = false;

	        let self = this;  // save this context

	        if (self.options.preloader) {
	            self.html.preloader = createPreloader(self.html.root);
	        }

	        self.html.canvas = createCanvas(self.html.root);
	        addHandlersCanvas(self.html.canvas, self.variables);

	        self.gl = initGL(self.html.canvas);
	        self.programInfo = initShaderProgram(
	            self.gl,
	            shaders.vertex.base(),
	            combineFragmentShader(self.options.effects)
	        );
	        self.buffers = initBuffers(self.gl, self.geometrySize); // инициализируем плоскость

	        self.loadItems(function () {
	            self.sortItems();

	            self.itemActive = self.options.startItem; // задаём начальный слайд
	            self.generateArrow();
	            self.generateDots();
	            self.slide(0, 0, 1, 1); // инициализируем начальный слайд

	            let then = 0;
	            // Draw the scene repeatedly
	            function render(now) {
	                // now *= 0.001;  // convert to seconds

	                if(self.onView){
	                    let deltaTime = now - then;
	                    then = now;

	                    if(self.animate.isActive){
	                        self.animate.currTime += deltaTime;
	                        self.variables.progress = self.animate.currTime/self.animate.totalTime;
	                    }

	                    if( self.variables.progress >= 1 ){
	                        self.variables.progress = 0;
	                        self.animate.isActive = false;
	                        self.changeImage(self.itemActive, self.itemActive, null);

	                        if (self.options.dots) {
	                            self.html.dots.querySelectorAll('button').forEach(element=>{
	                                element.classList.remove('is-active');
	                                if(parseInt(element.dataset.dotNumber) === self.itemActive ){
	                                    element.classList.add('is-active');
	                                }
	                            });
	                        }
	                    }

	                    drawScene(self.gl, self.items, self.itemActive, self.geometrySize, self.variables, self.programInfo, self.buffers, deltaTime);
	                }
	                requestAnimationFrame(render);
	            }
	            requestAnimationFrame(render);

	            if (self.options.preloader) {
	                removePreloader(self.html.preloader);
	            }

	            self.html.root.dataset.initialized = 'true';
	        });


	        if(self.options.renderInView){
	            let observer = new IntersectionObserver(()=>{
	                this.onView = !this.onView;
	            }, { threshold: '0.05' });
	            observer.observe(this.html.root);
	        } else {
	            this.onView = true;
	        }
	    }

	    /**
	     * Update plugin options and shader program
	     * @param options
	     */
	    update(options) {
	        this.options = mergeDeep(this.defaults, options);
	        this.programInfo = initShaderProgram(
	            this.gl,
	            shaders.vertex.base(),
	            combineFragmentShader(this.options.effects)
	        );
	    }

	    /**
	     * загружаем все картинки, проверяя доступны ли они,
	     * если не 404, то добавляем их в this.items[] 
	     */
	    loadItems(callback) {

	        // items = [];
	        let textureList = this.html.root.querySelectorAll('[data-item]');
	        // console.log(textureList);
	        let total = textureList.length;
	        let done = 0;
	        let fail = 0;

	        function loaded(state) {
	            if (state === 'done') {
	                done++;
	            } else {
	                fail++;
	            }
	            if (done + fail === total) {
	                setTimeout(function () {
	                    callback();
	                }, 20);
	            }
	        }

	        textureList.forEach((element,index) => {
	            let texture = element.querySelector('img, video');

	            if (texture.tagName === 'IMG' || texture.tagName === 'img') {
	                let url = new URL(texture.src);
	                this.items.push(loadTexture(this.gl, url, index, loaded));
	            }
	        });
	    }

	    /**
	     * Sorting items
	     */
	    sortItems(){
	        function compareIndex(itemA, itemB) {
	            return itemA.index - itemB.index;
	        }
	        this.items.sort(compareIndex);
	    }

	    changeImage(curr, next, dir) {
	        // Tell WebGL we want to affect texture unit 0
	        this.gl.activeTexture(this.gl.TEXTURE0);
	        // Bind the texture to texture unit 0
	        this.gl.bindTexture(this.gl.TEXTURE_2D, this.items[curr].texture);
	        // Tell WebGL we want to affect texture unit 1
	        this.gl.activeTexture(this.gl.TEXTURE1);
	        // Bind the texture to texture unit 0
	        this.gl.bindTexture(this.gl.TEXTURE_2D, this.items[next].texture);
	    }

	    // TODO: усложнить логику, сейчас только loop, а может быть не зацикленный слайдер
	    /**
	     * Общая функция для перехода между слайдами
	     */
	    slide(curr, next, dir, time) {
	        let self = this;  // save this context

	        time = (time >= 0) ? time : this.options.animationSpeed;

	        self.changeImage(curr, next, dir);

	        self.animate.isActive = true;
	        self.animate.currTime = 0;
	        self.animate.totalTime = time;
	        self.variables.progress = 0; // progress calculation is in requestAnimationFrame

	        self.itemActive = next;
	    }

	    /**
	     * Goes to item number X
	     * @param number - next item
	     */
	    slideTo(number) {
	        let self = this;  // save this context
	        if (0 <= number && number < self.items.length) {
	            self.slide(self.itemActive, number, 1);
	        }
	    }

	    /**
	     * Goes to next item
	     */
	    slideNext(){
	        if (this.itemActive + 1 < this.items.length) {
	            this.slide(this.itemActive, this.itemActive + 1, 1);
	        } else {
	            this.slide(this.itemActive, 0, 1);
	        }
	    }

	    /**
	     * Goes to previous item
	     */
	    slidePrev() {
	        if (this.itemActive - 1 >= 0) {
	            this.slide(this.itemActive, this.itemActive - 1, 1);
	        } else {
	            this.slide(this.itemActive, this.items.length - 1, 1);
	        }
	    }

	    generateArrow(){
	        let self = this;  // save this context
	        if (this.options.arrows) {
	            this.html.arrows = createArrows(this.html.root);
	            addHandlersNavigationArrows({
	                prev: this.html.arrows.prev,
	                prevAction: function () {
	                    self.slidePrev();
	                },
	                next: this.html.arrows.next,
	                nextAction: function () {
	                    self.slideNext();
	                }
	            });
	        }
	    }

	    generateDots(){
	        let self = this;  // save this context
	        if (this.options.dots) {
	            this.html.dots = createDots(this.html.root, this.items, this.options.startItem);
	            self.html.dots.querySelectorAll('button').forEach(element=>{
	                addHandlersNavigationDots(element, function () {
	                    self.slideTo(parseInt(element.dataset.dotNumber));
	                });
	            });
	        }
	    }
	}

	return webglSlider;

})));
