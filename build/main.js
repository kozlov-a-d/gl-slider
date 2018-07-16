(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.glslSlider = factory());
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

	/**
	 * Common utilities
	 * @module glMatrix
	 */

	// Configuration Constants
	const EPSILON = 0.000001;
	let ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;

	const degree = Math.PI / 180;

	/**
	 * @fileoverview gl-matrix - High performance matrix and vector operations
	 * @author Brandon Jones
	 * @author Colin MacKenzie IV
	 * @version 2.7.0
	 */
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
	    let out = new ARRAY_TYPE(16);
	    if(ARRAY_TYPE != Float32Array) {
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
	 * Creates a new mat4 initialized with values from an existing matrix
	 *
	 * @param {mat4} a matrix to clone
	 * @returns {mat4} a new 4x4 matrix
	 */
	function clone(a) {
	    let out = new ARRAY_TYPE(16);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    out[9] = a[9];
	    out[10] = a[10];
	    out[11] = a[11];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	}

	/**
	 * Copy the values from one mat4 to another
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	function copy(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    out[9] = a[9];
	    out[10] = a[10];
	    out[11] = a[11];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	}

	/**
	 * Create a new mat4 with the given values
	 *
	 * @param {Number} m00 Component in column 0, row 0 position (index 0)
	 * @param {Number} m01 Component in column 0, row 1 position (index 1)
	 * @param {Number} m02 Component in column 0, row 2 position (index 2)
	 * @param {Number} m03 Component in column 0, row 3 position (index 3)
	 * @param {Number} m10 Component in column 1, row 0 position (index 4)
	 * @param {Number} m11 Component in column 1, row 1 position (index 5)
	 * @param {Number} m12 Component in column 1, row 2 position (index 6)
	 * @param {Number} m13 Component in column 1, row 3 position (index 7)
	 * @param {Number} m20 Component in column 2, row 0 position (index 8)
	 * @param {Number} m21 Component in column 2, row 1 position (index 9)
	 * @param {Number} m22 Component in column 2, row 2 position (index 10)
	 * @param {Number} m23 Component in column 2, row 3 position (index 11)
	 * @param {Number} m30 Component in column 3, row 0 position (index 12)
	 * @param {Number} m31 Component in column 3, row 1 position (index 13)
	 * @param {Number} m32 Component in column 3, row 2 position (index 14)
	 * @param {Number} m33 Component in column 3, row 3 position (index 15)
	 * @returns {mat4} A new mat4
	 */
	function fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
	    let out = new ARRAY_TYPE(16);
	    out[0] = m00;
	    out[1] = m01;
	    out[2] = m02;
	    out[3] = m03;
	    out[4] = m10;
	    out[5] = m11;
	    out[6] = m12;
	    out[7] = m13;
	    out[8] = m20;
	    out[9] = m21;
	    out[10] = m22;
	    out[11] = m23;
	    out[12] = m30;
	    out[13] = m31;
	    out[14] = m32;
	    out[15] = m33;
	    return out;
	}

	/**
	 * Set the components of a mat4 to the given values
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {Number} m00 Component in column 0, row 0 position (index 0)
	 * @param {Number} m01 Component in column 0, row 1 position (index 1)
	 * @param {Number} m02 Component in column 0, row 2 position (index 2)
	 * @param {Number} m03 Component in column 0, row 3 position (index 3)
	 * @param {Number} m10 Component in column 1, row 0 position (index 4)
	 * @param {Number} m11 Component in column 1, row 1 position (index 5)
	 * @param {Number} m12 Component in column 1, row 2 position (index 6)
	 * @param {Number} m13 Component in column 1, row 3 position (index 7)
	 * @param {Number} m20 Component in column 2, row 0 position (index 8)
	 * @param {Number} m21 Component in column 2, row 1 position (index 9)
	 * @param {Number} m22 Component in column 2, row 2 position (index 10)
	 * @param {Number} m23 Component in column 2, row 3 position (index 11)
	 * @param {Number} m30 Component in column 3, row 0 position (index 12)
	 * @param {Number} m31 Component in column 3, row 1 position (index 13)
	 * @param {Number} m32 Component in column 3, row 2 position (index 14)
	 * @param {Number} m33 Component in column 3, row 3 position (index 15)
	 * @returns {mat4} out
	 */
	function set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
	    out[0] = m00;
	    out[1] = m01;
	    out[2] = m02;
	    out[3] = m03;
	    out[4] = m10;
	    out[5] = m11;
	    out[6] = m12;
	    out[7] = m13;
	    out[8] = m20;
	    out[9] = m21;
	    out[10] = m22;
	    out[11] = m23;
	    out[12] = m30;
	    out[13] = m31;
	    out[14] = m32;
	    out[15] = m33;
	    return out;
	}


	/**
	 * Set a mat4 to the identity matrix
	 *
	 * @param {mat4} out the receiving matrix
	 * @returns {mat4} out
	 */
	function identity(out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}

	/**
	 * Transpose the values of a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	function transpose(out, a) {
	    // If we are transposing ourselves we can skip a few steps but have to cache some values
	    if (out === a) {
	        let a01 = a[1], a02 = a[2], a03 = a[3];
	        let a12 = a[6], a13 = a[7];
	        let a23 = a[11];

	        out[1] = a[4];
	        out[2] = a[8];
	        out[3] = a[12];
	        out[4] = a01;
	        out[6] = a[9];
	        out[7] = a[13];
	        out[8] = a02;
	        out[9] = a12;
	        out[11] = a[14];
	        out[12] = a03;
	        out[13] = a13;
	        out[14] = a23;
	    } else {
	        out[0] = a[0];
	        out[1] = a[4];
	        out[2] = a[8];
	        out[3] = a[12];
	        out[4] = a[1];
	        out[5] = a[5];
	        out[6] = a[9];
	        out[7] = a[13];
	        out[8] = a[2];
	        out[9] = a[6];
	        out[10] = a[10];
	        out[11] = a[14];
	        out[12] = a[3];
	        out[13] = a[7];
	        out[14] = a[11];
	        out[15] = a[15];
	    }

	    return out;
	}

	/**
	 * Inverts a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	function invert(out, a) {
	    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
	    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
	    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
	    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

	    let b00 = a00 * a11 - a01 * a10;
	    let b01 = a00 * a12 - a02 * a10;
	    let b02 = a00 * a13 - a03 * a10;
	    let b03 = a01 * a12 - a02 * a11;
	    let b04 = a01 * a13 - a03 * a11;
	    let b05 = a02 * a13 - a03 * a12;
	    let b06 = a20 * a31 - a21 * a30;
	    let b07 = a20 * a32 - a22 * a30;
	    let b08 = a20 * a33 - a23 * a30;
	    let b09 = a21 * a32 - a22 * a31;
	    let b10 = a21 * a33 - a23 * a31;
	    let b11 = a22 * a33 - a23 * a32;

	    // Calculate the determinant
	    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	    if (!det) {
	        return null;
	    }
	    det = 1.0 / det;

	    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

	    return out;
	}

	/**
	 * Calculates the adjugate of a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	function adjoint(out, a) {
	    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
	    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
	    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
	    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

	    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
	    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
	    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
	    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
	    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
	    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
	    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
	    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
	    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
	    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
	    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
	    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
	    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
	    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
	    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
	    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
	    return out;
	}

	/**
	 * Calculates the determinant of a mat4
	 *
	 * @param {mat4} a the source matrix
	 * @returns {Number} determinant of a
	 */
	function determinant(a) {
	    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
	    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
	    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
	    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

	    let b00 = a00 * a11 - a01 * a10;
	    let b01 = a00 * a12 - a02 * a10;
	    let b02 = a00 * a13 - a03 * a10;
	    let b03 = a01 * a12 - a02 * a11;
	    let b04 = a01 * a13 - a03 * a11;
	    let b05 = a02 * a13 - a03 * a12;
	    let b06 = a20 * a31 - a21 * a30;
	    let b07 = a20 * a32 - a22 * a30;
	    let b08 = a20 * a33 - a23 * a30;
	    let b09 = a21 * a32 - a22 * a31;
	    let b10 = a21 * a33 - a23 * a31;
	    let b11 = a22 * a33 - a23 * a32;

	    // Calculate the determinant
	    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	}

	/**
	 * Multiplies two mat4s
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the first operand
	 * @param {mat4} b the second operand
	 * @returns {mat4} out
	 */
	function multiply(out, a, b) {
	    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
	    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
	    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
	    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

	    // Cache only the current line of the second matrix
	    let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
	    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

	    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
	    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

	    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
	    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

	    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
	    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
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

	    if (len < EPSILON) { return null; }

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
	 * Rotates a matrix by the given angle around the X axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	function rotateX(out, a, rad) {
	    let s = Math.sin(rad);
	    let c = Math.cos(rad);
	    let a10 = a[4];
	    let a11 = a[5];
	    let a12 = a[6];
	    let a13 = a[7];
	    let a20 = a[8];
	    let a21 = a[9];
	    let a22 = a[10];
	    let a23 = a[11];

	    if (a !== out) { // If the source and destination differ, copy the unchanged rows
	        out[0]  = a[0];
	        out[1]  = a[1];
	        out[2]  = a[2];
	        out[3]  = a[3];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }

	    // Perform axis-specific matrix multiplication
	    out[4] = a10 * c + a20 * s;
	    out[5] = a11 * c + a21 * s;
	    out[6] = a12 * c + a22 * s;
	    out[7] = a13 * c + a23 * s;
	    out[8] = a20 * c - a10 * s;
	    out[9] = a21 * c - a11 * s;
	    out[10] = a22 * c - a12 * s;
	    out[11] = a23 * c - a13 * s;
	    return out;
	}

	/**
	 * Rotates a matrix by the given angle around the Y axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	function rotateY(out, a, rad) {
	    let s = Math.sin(rad);
	    let c = Math.cos(rad);
	    let a00 = a[0];
	    let a01 = a[1];
	    let a02 = a[2];
	    let a03 = a[3];
	    let a20 = a[8];
	    let a21 = a[9];
	    let a22 = a[10];
	    let a23 = a[11];

	    if (a !== out) { // If the source and destination differ, copy the unchanged rows
	        out[4]  = a[4];
	        out[5]  = a[5];
	        out[6]  = a[6];
	        out[7]  = a[7];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }

	    // Perform axis-specific matrix multiplication
	    out[0] = a00 * c - a20 * s;
	    out[1] = a01 * c - a21 * s;
	    out[2] = a02 * c - a22 * s;
	    out[3] = a03 * c - a23 * s;
	    out[8] = a00 * s + a20 * c;
	    out[9] = a01 * s + a21 * c;
	    out[10] = a02 * s + a22 * c;
	    out[11] = a03 * s + a23 * c;
	    return out;
	}

	/**
	 * Rotates a matrix by the given angle around the Z axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	function rotateZ(out, a, rad) {
	    let s = Math.sin(rad);
	    let c = Math.cos(rad);
	    let a00 = a[0];
	    let a01 = a[1];
	    let a02 = a[2];
	    let a03 = a[3];
	    let a10 = a[4];
	    let a11 = a[5];
	    let a12 = a[6];
	    let a13 = a[7];

	    if (a !== out) { // If the source and destination differ, copy the unchanged last row
	        out[8]  = a[8];
	        out[9]  = a[9];
	        out[10] = a[10];
	        out[11] = a[11];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }

	    // Perform axis-specific matrix multiplication
	    out[0] = a00 * c + a10 * s;
	    out[1] = a01 * c + a11 * s;
	    out[2] = a02 * c + a12 * s;
	    out[3] = a03 * c + a13 * s;
	    out[4] = a10 * c - a00 * s;
	    out[5] = a11 * c - a01 * s;
	    out[6] = a12 * c - a02 * s;
	    out[7] = a13 * c - a03 * s;
	    return out;
	}

	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, dest, vec);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {vec3} v Translation vector
	 * @returns {mat4} out
	 */
	function fromTranslation(out, v) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = v[0];
	    out[13] = v[1];
	    out[14] = v[2];
	    out[15] = 1;
	    return out;
	}

	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.scale(dest, dest, vec);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {vec3} v Scaling vector
	 * @returns {mat4} out
	 */
	function fromScaling(out, v) {
	    out[0] = v[0];
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = v[1];
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = v[2];
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}

	/**
	 * Creates a matrix from a given angle around a given axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotate(dest, dest, rad, axis);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @param {vec3} axis the axis to rotate around
	 * @returns {mat4} out
	 */
	function fromRotation(out, rad, axis) {
	    let x = axis[0], y = axis[1], z = axis[2];
	    let len = Math.sqrt(x * x + y * y + z * z);
	    let s, c, t;

	    if (len < EPSILON) { return null; }

	    len = 1 / len;
	    x *= len;
	    y *= len;
	    z *= len;

	    s = Math.sin(rad);
	    c = Math.cos(rad);
	    t = 1 - c;

	    // Perform rotation-specific matrix multiplication
	    out[0] = x * x * t + c;
	    out[1] = y * x * t + z * s;
	    out[2] = z * x * t - y * s;
	    out[3] = 0;
	    out[4] = x * y * t - z * s;
	    out[5] = y * y * t + c;
	    out[6] = z * y * t + x * s;
	    out[7] = 0;
	    out[8] = x * z * t + y * s;
	    out[9] = y * z * t - x * s;
	    out[10] = z * z * t + c;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}

	/**
	 * Creates a matrix from the given angle around the X axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateX(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	function fromXRotation(out, rad) {
	    let s = Math.sin(rad);
	    let c = Math.cos(rad);

	    // Perform axis-specific matrix multiplication
	    out[0]  = 1;
	    out[1]  = 0;
	    out[2]  = 0;
	    out[3]  = 0;
	    out[4] = 0;
	    out[5] = c;
	    out[6] = s;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = -s;
	    out[10] = c;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}

	/**
	 * Creates a matrix from the given angle around the Y axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateY(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	function fromYRotation(out, rad) {
	    let s = Math.sin(rad);
	    let c = Math.cos(rad);

	    // Perform axis-specific matrix multiplication
	    out[0]  = c;
	    out[1]  = 0;
	    out[2]  = -s;
	    out[3]  = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = s;
	    out[9] = 0;
	    out[10] = c;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}

	/**
	 * Creates a matrix from the given angle around the Z axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateZ(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	function fromZRotation(out, rad) {
	    let s = Math.sin(rad);
	    let c = Math.cos(rad);

	    // Perform axis-specific matrix multiplication
	    out[0]  = c;
	    out[1]  = s;
	    out[2]  = 0;
	    out[3]  = 0;
	    out[4] = -s;
	    out[5] = c;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}

	/**
	 * Creates a matrix from a quaternion rotation and vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     let quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @returns {mat4} out
	 */
	function fromRotationTranslation(out, q, v) {
	    // Quaternion math
	    let x = q[0], y = q[1], z = q[2], w = q[3];
	    let x2 = x + x;
	    let y2 = y + y;
	    let z2 = z + z;

	    let xx = x * x2;
	    let xy = x * y2;
	    let xz = x * z2;
	    let yy = y * y2;
	    let yz = y * z2;
	    let zz = z * z2;
	    let wx = w * x2;
	    let wy = w * y2;
	    let wz = w * z2;

	    out[0] = 1 - (yy + zz);
	    out[1] = xy + wz;
	    out[2] = xz - wy;
	    out[3] = 0;
	    out[4] = xy - wz;
	    out[5] = 1 - (xx + zz);
	    out[6] = yz + wx;
	    out[7] = 0;
	    out[8] = xz + wy;
	    out[9] = yz - wx;
	    out[10] = 1 - (xx + yy);
	    out[11] = 0;
	    out[12] = v[0];
	    out[13] = v[1];
	    out[14] = v[2];
	    out[15] = 1;

	    return out;
	}

	/**
	 * Creates a new mat4 from a dual quat.
	 *
	 * @param {mat4} out Matrix
	 * @param {quat2} a Dual Quaternion
	 * @returns {mat4} mat4 receiving operation result
	 */
	function fromQuat2(out, a) {
	    let translation = new ARRAY_TYPE(3);
	    let bx = -a[0], by = -a[1], bz = -a[2], bw = a[3],
	        ax = a[4], ay = a[5], az = a[6], aw = a[7];

	    let magnitude = bx * bx + by * by + bz * bz + bw * bw;
	    //Only scale if it makes sense
	    if (magnitude > 0) {
	        translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
	        translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
	        translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
	    } else {
	        translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
	        translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
	        translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
	    }
	    fromRotationTranslation(out, a, translation);
	    return out;
	}

	/**
	 * Returns the translation vector component of a transformation
	 *  matrix. If a matrix is built with fromRotationTranslation,
	 *  the returned vector will be the same as the translation vector
	 *  originally supplied.
	 * @param  {vec3} out Vector to receive translation component
	 * @param  {mat4} mat Matrix to be decomposed (input)
	 * @return {vec3} out
	 */
	function getTranslation(out, mat) {
	    out[0] = mat[12];
	    out[1] = mat[13];
	    out[2] = mat[14];

	    return out;
	}

	/**
	 * Returns the scaling factor component of a transformation
	 *  matrix. If a matrix is built with fromRotationTranslationScale
	 *  with a normalized Quaternion paramter, the returned vector will be
	 *  the same as the scaling vector
	 *  originally supplied.
	 * @param  {vec3} out Vector to receive scaling factor component
	 * @param  {mat4} mat Matrix to be decomposed (input)
	 * @return {vec3} out
	 */
	function getScaling(out, mat) {
	    let m11 = mat[0];
	    let m12 = mat[1];
	    let m13 = mat[2];
	    let m21 = mat[4];
	    let m22 = mat[5];
	    let m23 = mat[6];
	    let m31 = mat[8];
	    let m32 = mat[9];
	    let m33 = mat[10];

	    out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
	    out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
	    out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);

	    return out;
	}

	/**
	 * Returns a quaternion representing the rotational component
	 *  of a transformation matrix. If a matrix is built with
	 *  fromRotationTranslation, the returned quaternion will be the
	 *  same as the quaternion originally supplied.
	 * @param {quat} out Quaternion to receive the rotation component
	 * @param {mat4} mat Matrix to be decomposed (input)
	 * @return {quat} out
	 */
	function getRotation(out, mat) {
	    // Algorithm taken from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
	    let trace = mat[0] + mat[5] + mat[10];
	    let S = 0;

	    if (trace > 0) {
	        S = Math.sqrt(trace + 1.0) * 2;
	        out[3] = 0.25 * S;
	        out[0] = (mat[6] - mat[9]) / S;
	        out[1] = (mat[8] - mat[2]) / S;
	        out[2] = (mat[1] - mat[4]) / S;
	    } else if ((mat[0] > mat[5]) && (mat[0] > mat[10])) {
	        S = Math.sqrt(1.0 + mat[0] - mat[5] - mat[10]) * 2;
	        out[3] = (mat[6] - mat[9]) / S;
	        out[0] = 0.25 * S;
	        out[1] = (mat[1] + mat[4]) / S;
	        out[2] = (mat[8] + mat[2]) / S;
	    } else if (mat[5] > mat[10]) {
	        S = Math.sqrt(1.0 + mat[5] - mat[0] - mat[10]) * 2;
	        out[3] = (mat[8] - mat[2]) / S;
	        out[0] = (mat[1] + mat[4]) / S;
	        out[1] = 0.25 * S;
	        out[2] = (mat[6] + mat[9]) / S;
	    } else {
	        S = Math.sqrt(1.0 + mat[10] - mat[0] - mat[5]) * 2;
	        out[3] = (mat[1] - mat[4]) / S;
	        out[0] = (mat[8] + mat[2]) / S;
	        out[1] = (mat[6] + mat[9]) / S;
	        out[2] = 0.25 * S;
	    }

	    return out;
	}

	/**
	 * Creates a matrix from a quaternion rotation, vector translation and vector scale
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     let quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *     mat4.scale(dest, scale)
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @param {vec3} s Scaling vector
	 * @returns {mat4} out
	 */
	function fromRotationTranslationScale(out, q, v, s) {
	    // Quaternion math
	    let x = q[0], y = q[1], z = q[2], w = q[3];
	    let x2 = x + x;
	    let y2 = y + y;
	    let z2 = z + z;

	    let xx = x * x2;
	    let xy = x * y2;
	    let xz = x * z2;
	    let yy = y * y2;
	    let yz = y * z2;
	    let zz = z * z2;
	    let wx = w * x2;
	    let wy = w * y2;
	    let wz = w * z2;
	    let sx = s[0];
	    let sy = s[1];
	    let sz = s[2];

	    out[0] = (1 - (yy + zz)) * sx;
	    out[1] = (xy + wz) * sx;
	    out[2] = (xz - wy) * sx;
	    out[3] = 0;
	    out[4] = (xy - wz) * sy;
	    out[5] = (1 - (xx + zz)) * sy;
	    out[6] = (yz + wx) * sy;
	    out[7] = 0;
	    out[8] = (xz + wy) * sz;
	    out[9] = (yz - wx) * sz;
	    out[10] = (1 - (xx + yy)) * sz;
	    out[11] = 0;
	    out[12] = v[0];
	    out[13] = v[1];
	    out[14] = v[2];
	    out[15] = 1;

	    return out;
	}

	/**
	 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     mat4.translate(dest, origin);
	 *     let quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *     mat4.scale(dest, scale)
	 *     mat4.translate(dest, negativeOrigin);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @param {vec3} s Scaling vector
	 * @param {vec3} o The origin vector around which to scale and rotate
	 * @returns {mat4} out
	 */
	function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
	    // Quaternion math
	    let x = q[0], y = q[1], z = q[2], w = q[3];
	    let x2 = x + x;
	    let y2 = y + y;
	    let z2 = z + z;

	    let xx = x * x2;
	    let xy = x * y2;
	    let xz = x * z2;
	    let yy = y * y2;
	    let yz = y * z2;
	    let zz = z * z2;
	    let wx = w * x2;
	    let wy = w * y2;
	    let wz = w * z2;

	    let sx = s[0];
	    let sy = s[1];
	    let sz = s[2];

	    let ox = o[0];
	    let oy = o[1];
	    let oz = o[2];

	    let out0 = (1 - (yy + zz)) * sx;
	    let out1 = (xy + wz) * sx;
	    let out2 = (xz - wy) * sx;
	    let out4 = (xy - wz) * sy;
	    let out5 = (1 - (xx + zz)) * sy;
	    let out6 = (yz + wx) * sy;
	    let out8 = (xz + wy) * sz;
	    let out9 = (yz - wx) * sz;
	    let out10 = (1 - (xx + yy)) * sz;

	    out[0] = out0;
	    out[1] = out1;
	    out[2] = out2;
	    out[3] = 0;
	    out[4] = out4;
	    out[5] = out5;
	    out[6] = out6;
	    out[7] = 0;
	    out[8] = out8;
	    out[9] = out9;
	    out[10] = out10;
	    out[11] = 0;
	    out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
	    out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
	    out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
	    out[15] = 1;

	    return out;
	}

	/**
	 * Calculates a 4x4 matrix from the given quaternion
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat} q Quaternion to create matrix from
	 *
	 * @returns {mat4} out
	 */
	function fromQuat(out, q) {
	    let x = q[0], y = q[1], z = q[2], w = q[3];
	    let x2 = x + x;
	    let y2 = y + y;
	    let z2 = z + z;

	    let xx = x * x2;
	    let yx = y * x2;
	    let yy = y * y2;
	    let zx = z * x2;
	    let zy = z * y2;
	    let zz = z * z2;
	    let wx = w * x2;
	    let wy = w * y2;
	    let wz = w * z2;

	    out[0] = 1 - yy - zz;
	    out[1] = yx + wz;
	    out[2] = zx - wy;
	    out[3] = 0;

	    out[4] = yx - wz;
	    out[5] = 1 - xx - zz;
	    out[6] = zy + wx;
	    out[7] = 0;

	    out[8] = zx + wy;
	    out[9] = zy - wx;
	    out[10] = 1 - xx - yy;
	    out[11] = 0;

	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;

	    return out;
	}

	/**
	 * Generates a frustum matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {Number} left Left bound of the frustum
	 * @param {Number} right Right bound of the frustum
	 * @param {Number} bottom Bottom bound of the frustum
	 * @param {Number} top Top bound of the frustum
	 * @param {Number} near Near bound of the frustum
	 * @param {Number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	function frustum(out, left, right, bottom, top, near, far) {
	    let rl = 1 / (right - left);
	    let tb = 1 / (top - bottom);
	    let nf = 1 / (near - far);
	    out[0] = (near * 2) * rl;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = (near * 2) * tb;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = (right + left) * rl;
	    out[9] = (top + bottom) * tb;
	    out[10] = (far + near) * nf;
	    out[11] = -1;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = (far * near * 2) * nf;
	    out[15] = 0;
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
	 * Generates a perspective projection matrix with the given field of view.
	 * This is primarily useful for generating projection matrices to be used
	 * with the still experiemental WebVR API.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	function perspectiveFromFieldOfView(out, fov, near, far) {
	    let upTan = Math.tan(fov.upDegrees * Math.PI/180.0);
	    let downTan = Math.tan(fov.downDegrees * Math.PI/180.0);
	    let leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0);
	    let rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0);
	    let xScale = 2.0 / (leftTan + rightTan);
	    let yScale = 2.0 / (upTan + downTan);

	    out[0] = xScale;
	    out[1] = 0.0;
	    out[2] = 0.0;
	    out[3] = 0.0;
	    out[4] = 0.0;
	    out[5] = yScale;
	    out[6] = 0.0;
	    out[7] = 0.0;
	    out[8] = -((leftTan - rightTan) * xScale * 0.5);
	    out[9] = ((upTan - downTan) * yScale * 0.5);
	    out[10] = far / (near - far);
	    out[11] = -1.0;
	    out[12] = 0.0;
	    out[13] = 0.0;
	    out[14] = (far * near) / (near - far);
	    out[15] = 0.0;
	    return out;
	}

	/**
	 * Generates a orthogonal projection matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} left Left bound of the frustum
	 * @param {number} right Right bound of the frustum
	 * @param {number} bottom Bottom bound of the frustum
	 * @param {number} top Top bound of the frustum
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	function ortho(out, left, right, bottom, top, near, far) {
	    let lr = 1 / (left - right);
	    let bt = 1 / (bottom - top);
	    let nf = 1 / (near - far);
	    out[0] = -2 * lr;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = -2 * bt;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 2 * nf;
	    out[11] = 0;
	    out[12] = (left + right) * lr;
	    out[13] = (top + bottom) * bt;
	    out[14] = (far + near) * nf;
	    out[15] = 1;
	    return out;
	}

	/**
	 * Generates a look-at matrix with the given eye position, focal point, and up axis.
	 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {vec3} eye Position of the viewer
	 * @param {vec3} center Point the viewer is looking at
	 * @param {vec3} up vec3 pointing up
	 * @returns {mat4} out
	 */
	function lookAt(out, eye, center, up) {
	    let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
	    let eyex = eye[0];
	    let eyey = eye[1];
	    let eyez = eye[2];
	    let upx = up[0];
	    let upy = up[1];
	    let upz = up[2];
	    let centerx = center[0];
	    let centery = center[1];
	    let centerz = center[2];

	    if (Math.abs(eyex - centerx) < EPSILON &&
	        Math.abs(eyey - centery) < EPSILON &&
	        Math.abs(eyez - centerz) < EPSILON) {
	        return identity(out);
	    }

	    z0 = eyex - centerx;
	    z1 = eyey - centery;
	    z2 = eyez - centerz;

	    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
	    z0 *= len;
	    z1 *= len;
	    z2 *= len;

	    x0 = upy * z2 - upz * z1;
	    x1 = upz * z0 - upx * z2;
	    x2 = upx * z1 - upy * z0;
	    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
	    if (!len) {
	        x0 = 0;
	        x1 = 0;
	        x2 = 0;
	    } else {
	        len = 1 / len;
	        x0 *= len;
	        x1 *= len;
	        x2 *= len;
	    }

	    y0 = z1 * x2 - z2 * x1;
	    y1 = z2 * x0 - z0 * x2;
	    y2 = z0 * x1 - z1 * x0;

	    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
	    if (!len) {
	        y0 = 0;
	        y1 = 0;
	        y2 = 0;
	    } else {
	        len = 1 / len;
	        y0 *= len;
	        y1 *= len;
	        y2 *= len;
	    }

	    out[0] = x0;
	    out[1] = y0;
	    out[2] = z0;
	    out[3] = 0;
	    out[4] = x1;
	    out[5] = y1;
	    out[6] = z1;
	    out[7] = 0;
	    out[8] = x2;
	    out[9] = y2;
	    out[10] = z2;
	    out[11] = 0;
	    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
	    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
	    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
	    out[15] = 1;

	    return out;
	}

	/**
	 * Generates a matrix that makes something look at something else.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {vec3} eye Position of the viewer
	 * @param {vec3} center Point the viewer is looking at
	 * @param {vec3} up vec3 pointing up
	 * @returns {mat4} out
	 */
	function targetTo(out, eye, target, up) {
	    let eyex = eye[0],
	        eyey = eye[1],
	        eyez = eye[2],
	        upx = up[0],
	        upy = up[1],
	        upz = up[2];

	    let z0 = eyex - target[0],
	        z1 = eyey - target[1],
	        z2 = eyez - target[2];

	    let len = z0*z0 + z1*z1 + z2*z2;
	    if (len > 0) {
	        len = 1 / Math.sqrt(len);
	        z0 *= len;
	        z1 *= len;
	        z2 *= len;
	    }

	    let x0 = upy * z2 - upz * z1,
	        x1 = upz * z0 - upx * z2,
	        x2 = upx * z1 - upy * z0;

	    len = x0*x0 + x1*x1 + x2*x2;
	    if (len > 0) {
	        len = 1 / Math.sqrt(len);
	        x0 *= len;
	        x1 *= len;
	        x2 *= len;
	    }

	    out[0] = x0;
	    out[1] = x1;
	    out[2] = x2;
	    out[3] = 0;
	    out[4] = z1 * x2 - z2 * x1;
	    out[5] = z2 * x0 - z0 * x2;
	    out[6] = z0 * x1 - z1 * x0;
	    out[7] = 0;
	    out[8] = z0;
	    out[9] = z1;
	    out[10] = z2;
	    out[11] = 0;
	    out[12] = eyex;
	    out[13] = eyey;
	    out[14] = eyez;
	    out[15] = 1;
	    return out;
	}
	/**
	 * Returns a string representation of a mat4
	 *
	 * @param {mat4} a matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */
	function str(a) {
	    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
	        a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
	        a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' +
	        a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
	}

	/**
	 * Returns Frobenius norm of a mat4
	 *
	 * @param {mat4} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */
	function frob(a) {
	    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2) + Math.pow(a[9], 2) + Math.pow(a[10], 2) + Math.pow(a[11], 2) + Math.pow(a[12], 2) + Math.pow(a[13], 2) + Math.pow(a[14], 2) + Math.pow(a[15], 2) ))
	}

	/**
	 * Adds two mat4's
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the first operand
	 * @param {mat4} b the second operand
	 * @returns {mat4} out
	 */
	function add(out, a, b) {
	    out[0] = a[0] + b[0];
	    out[1] = a[1] + b[1];
	    out[2] = a[2] + b[2];
	    out[3] = a[3] + b[3];
	    out[4] = a[4] + b[4];
	    out[5] = a[5] + b[5];
	    out[6] = a[6] + b[6];
	    out[7] = a[7] + b[7];
	    out[8] = a[8] + b[8];
	    out[9] = a[9] + b[9];
	    out[10] = a[10] + b[10];
	    out[11] = a[11] + b[11];
	    out[12] = a[12] + b[12];
	    out[13] = a[13] + b[13];
	    out[14] = a[14] + b[14];
	    out[15] = a[15] + b[15];
	    return out;
	}

	/**
	 * Subtracts matrix b from matrix a
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the first operand
	 * @param {mat4} b the second operand
	 * @returns {mat4} out
	 */
	function subtract(out, a, b) {
	    out[0] = a[0] - b[0];
	    out[1] = a[1] - b[1];
	    out[2] = a[2] - b[2];
	    out[3] = a[3] - b[3];
	    out[4] = a[4] - b[4];
	    out[5] = a[5] - b[5];
	    out[6] = a[6] - b[6];
	    out[7] = a[7] - b[7];
	    out[8] = a[8] - b[8];
	    out[9] = a[9] - b[9];
	    out[10] = a[10] - b[10];
	    out[11] = a[11] - b[11];
	    out[12] = a[12] - b[12];
	    out[13] = a[13] - b[13];
	    out[14] = a[14] - b[14];
	    out[15] = a[15] - b[15];
	    return out;
	}

	/**
	 * Multiply each element of the matrix by a scalar.
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to scale
	 * @param {Number} b amount to scale the matrix's elements by
	 * @returns {mat4} out
	 */
	function multiplyScalar(out, a, b) {
	    out[0] = a[0] * b;
	    out[1] = a[1] * b;
	    out[2] = a[2] * b;
	    out[3] = a[3] * b;
	    out[4] = a[4] * b;
	    out[5] = a[5] * b;
	    out[6] = a[6] * b;
	    out[7] = a[7] * b;
	    out[8] = a[8] * b;
	    out[9] = a[9] * b;
	    out[10] = a[10] * b;
	    out[11] = a[11] * b;
	    out[12] = a[12] * b;
	    out[13] = a[13] * b;
	    out[14] = a[14] * b;
	    out[15] = a[15] * b;
	    return out;
	}

	/**
	 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
	 *
	 * @param {mat4} out the receiving vector
	 * @param {mat4} a the first operand
	 * @param {mat4} b the second operand
	 * @param {Number} scale the amount to scale b's elements by before adding
	 * @returns {mat4} out
	 */
	function multiplyScalarAndAdd(out, a, b, scale) {
	    out[0] = a[0] + (b[0] * scale);
	    out[1] = a[1] + (b[1] * scale);
	    out[2] = a[2] + (b[2] * scale);
	    out[3] = a[3] + (b[3] * scale);
	    out[4] = a[4] + (b[4] * scale);
	    out[5] = a[5] + (b[5] * scale);
	    out[6] = a[6] + (b[6] * scale);
	    out[7] = a[7] + (b[7] * scale);
	    out[8] = a[8] + (b[8] * scale);
	    out[9] = a[9] + (b[9] * scale);
	    out[10] = a[10] + (b[10] * scale);
	    out[11] = a[11] + (b[11] * scale);
	    out[12] = a[12] + (b[12] * scale);
	    out[13] = a[13] + (b[13] * scale);
	    out[14] = a[14] + (b[14] * scale);
	    out[15] = a[15] + (b[15] * scale);
	    return out;
	}

	/**
	 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {mat4} a The first matrix.
	 * @param {mat4} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */
	function exactEquals(a, b) {
	    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] &&
	        a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] &&
	        a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] &&
	        a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
	}

	/**
	 * Returns whether or not the matrices have approximately the same elements in the same position.
	 *
	 * @param {mat4} a The first matrix.
	 * @param {mat4} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */
	function equals$1(a, b) {
	    let a0  = a[0],  a1  = a[1],  a2  = a[2],  a3  = a[3];
	    let a4  = a[4],  a5  = a[5],  a6  = a[6],  a7  = a[7];
	    let a8  = a[8],  a9  = a[9],  a10 = a[10], a11 = a[11];
	    let a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];

	    let b0  = b[0],  b1  = b[1],  b2  = b[2],  b3  = b[3];
	    let b4  = b[4],  b5  = b[5],  b6  = b[6],  b7  = b[7];
	    let b8  = b[8],  b9  = b[9],  b10 = b[10], b11 = b[11];
	    let b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];

	    return (Math.abs(a0 - b0) <= EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
	        Math.abs(a1 - b1) <= EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
	        Math.abs(a2 - b2) <= EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
	        Math.abs(a3 - b3) <= EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
	        Math.abs(a4 - b4) <= EPSILON*Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
	        Math.abs(a5 - b5) <= EPSILON*Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
	        Math.abs(a6 - b6) <= EPSILON*Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
	        Math.abs(a7 - b7) <= EPSILON*Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
	        Math.abs(a8 - b8) <= EPSILON*Math.max(1.0, Math.abs(a8), Math.abs(b8)) &&
	        Math.abs(a9 - b9) <= EPSILON*Math.max(1.0, Math.abs(a9), Math.abs(b9)) &&
	        Math.abs(a10 - b10) <= EPSILON*Math.max(1.0, Math.abs(a10), Math.abs(b10)) &&
	        Math.abs(a11 - b11) <= EPSILON*Math.max(1.0, Math.abs(a11), Math.abs(b11)) &&
	        Math.abs(a12 - b12) <= EPSILON*Math.max(1.0, Math.abs(a12), Math.abs(b12)) &&
	        Math.abs(a13 - b13) <= EPSILON*Math.max(1.0, Math.abs(a13), Math.abs(b13)) &&
	        Math.abs(a14 - b14) <= EPSILON*Math.max(1.0, Math.abs(a14), Math.abs(b14)) &&
	        Math.abs(a15 - b15) <= EPSILON*Math.max(1.0, Math.abs(a15), Math.abs(b15)));
	}

	/**
	 * Alias for {@link mat4.multiply}
	 * @function
	 */
	const mul = multiply;

	/**
	 * Alias for {@link mat4.subtract}
	 * @function
	 */
	const sub = subtract;

	var mat4 = /*#__PURE__*/Object.freeze({
		create: create,
		clone: clone,
		copy: copy,
		fromValues: fromValues,
		set: set,
		identity: identity,
		transpose: transpose,
		invert: invert,
		adjoint: adjoint,
		determinant: determinant,
		multiply: multiply,
		translate: translate,
		scale: scale,
		rotate: rotate,
		rotateX: rotateX,
		rotateY: rotateY,
		rotateZ: rotateZ,
		fromTranslation: fromTranslation,
		fromScaling: fromScaling,
		fromRotation: fromRotation,
		fromXRotation: fromXRotation,
		fromYRotation: fromYRotation,
		fromZRotation: fromZRotation,
		fromRotationTranslation: fromRotationTranslation,
		fromQuat2: fromQuat2,
		getTranslation: getTranslation,
		getScaling: getScaling,
		getRotation: getRotation,
		fromRotationTranslationScale: fromRotationTranslationScale,
		fromRotationTranslationScaleOrigin: fromRotationTranslationScaleOrigin,
		fromQuat: fromQuat,
		frustum: frustum,
		perspective: perspective,
		perspectiveFromFieldOfView: perspectiveFromFieldOfView,
		ortho: ortho,
		lookAt: lookAt,
		targetTo: targetTo,
		str: str,
		frob: frob,
		add: add,
		subtract: subtract,
		multiplyScalar: multiplyScalar,
		multiplyScalarAndAdd: multiplyScalarAndAdd,
		exactEquals: exactEquals,
		equals: equals$1,
		mul: mul,
		sub: sub
	});

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
	 * @param {WebGLContext} gl
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

	    let programInfo = {
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

	    return programInfo;
	}

	/**
	 * Creates a shader of the given type, uploads the source and compiles it.
	 * @param {WebGLContext} gl
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

	function drawScene(gl, items, itemActive, geometrySize, variables, programInfo, buffers,  deltaTime) {

	    // console.log(deltaTime);
	    // variables.time += deltaTime;
	    // console.log(variables.time);
	    resize(gl, variables);

	    console.log(mat4);

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
	    arrows.prev.addEventListener('click', function(e){
	        arrows.prevAction();
	    });
	    arrows.next.addEventListener('click', function(e){
	        arrows.nextAction();
	    });
	}

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
	    preloader.classList.add('slider__preloader');

	    let spinner = document.createElement('div');
	    spinner.classList.add('slider__preloader-spinner');

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
	    arrows.classList.add('slider__arrows-container');

	    let arrowNext = document.createElement('button');
	    arrowNext.classList.add('slider__arrows-btn');
	    arrowNext.classList.add('-next');
	    arrowNext.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="10 18 16 12 10 6"></polyline></svg>';

	    let arrowPrev = document.createElement('button');
	    arrowPrev.classList.add('slider__arrows-btn');
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
	    dots.classList.add('slider__dots-container');

	    for (let i = 0; i < items.length; i++) {
	        let dot = document.createElement('button');
	        dot.classList.add('slider__dot');
	        if (i === itemActive) {
	            dot.classList.add('is-active');
	        }
	        dot.setAttribute('data-dot-number', i.toString());
	        dot.innerHTML = 'i';
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

	class Slider {

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
	            startItem: 0
	        };
	        this.html = {
	            root: rootEl,
	            canvas: null,
	            preloader: null,
	            arrows: null,
	            dots: null
	        };
	        this.geometrySize = {
	            x: 30,
	            y: 20
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
	            console.log(self.items);
	            console.log( self.itemActive);
	            self.generateArrow();
	            self.generateDots();

	            self.slide(0, 0, 1, 0); // инициализируем начальный слайд

	            let then = 0;

	            // Draw the scene repeatedly
	            function render(now) {
	                now *= 0.001;  // convert to seconds
	                let deltaTime = now - then;
	                then = now;

	                drawScene(self.gl, self.items, self.itemActive, self.geometrySize, self.variables, self.programInfo, self.buffers, deltaTime);

	                requestAnimationFrame(render);
	            }
	            requestAnimationFrame(render);

	            if (self.options.preloader) {
	                removePreloader(self.html.preloader);
	            }

	            self.html.root.dataset.initialized = 'true';

	        });
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

	    // TODO: усложнить логику, сейчас только loop, а может быть не зацикленный слайдер
	    /**
	     * Общая функция для перехода между слайдами
	     */
	    slide(curr, next, dir, time) {

	        let self = this;  // save this context

	        time = (time >= 0) ? time : this.options.animationSpeed;

	        if (time === 0) {
	            changeImage(curr, curr, dir);
	            self.variables.progress = 0;
	            self.itemActive = next;
	        } else {
	            changeImage(curr, next, dir);

	            animateNumber(self.variables.progress, 0, 1, time, function () {
	                changeImage(next, next, dir);
	                self.variables.progress = 0;
	                self.itemActive = next;

	                if (self.options.dots) {
	                    self.html.root.querySelectorAll('[data-dot-number]').forEach(element=>{
	                        element.classList.remove('is-active');
	                    });
	                    self.html.root.querySelector('[data-dot-number=' + self.itemActive + ']').classList.add('is-active');
	                }

	            });

	        }

	        function animateNumber(where, from, to, time, cb) {
	            // let start = new Date().getTime();
	            //
	            // function delta(_progress) {
	            //     return Math.pow(_progress, 2);
	            // }
	            //
	            // setTimeout(function () {
	            //     let now = (new Date().getTime()) - start;
	            //     let _progress = now / time;
	            //     let result = (to - from) * delta(_progress) + from;
	            //     self.variables.progress = (result > 1) ? 1 : result;
	            //
	            //     if (_progress < 1) {
	            //         setTimeout(arguments.callee, 5);
	            //     } else {
	            //         cb();
	            //     }
	            // }, 10);

	        }

	        function changeImage(curr, next, dir) {
	            console.log('curr', self.items[curr]);
	            console.log('next', self.items[next]);
	            // Tell WebGL we want to affect texture unit 0
	            self.gl.activeTexture(self.gl.TEXTURE0);
	            // Bind the texture to texture unit 0
	            self.gl.bindTexture(self.gl.TEXTURE_2D, self.items[curr].texture);
	            // Tell WebGL we want to affect texture unit 1
	            self.gl.activeTexture(self.gl.TEXTURE1);
	            // Bind the texture to texture unit 0
	            self.gl.bindTexture(self.gl.TEXTURE_2D, self.items[next].texture);
	        }

	    }

	    /**
	     * Goes to item number X
	     * @param number - next item
	     */
	    slideTo(number) {
	        if (0 <= number && number < this.items.length) {
	            this.slide(this.itemActive, number, 1);
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
	                    self.slideNext;
	                }
	            });
	        }
	    }

	    generateDots(){
	        if (this.options.dots) {
	            this.html.dots = createDots(this.html.root, this.items, this.options.startItem);
	        }
	    }

	    test() {
	        console.log('I\'m slider');
	        console.log(this.options);
	    }
	}

	return Slider;

})));
