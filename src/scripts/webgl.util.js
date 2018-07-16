import {  shaders } from '../shaders/shaders';
import * as  mat4 from './mat4.util';

/**
 * Initialize WebGl context
 * @param {*} canvas html canvas element
 */
export function initGL(canvas) {
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
export function initShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {
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
export function loadShader(gl, type, source) {
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
export function combineFragmentShader(effects) {
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

export function initBuffers(gl, geometrySize) {
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

export function loadTexture(gl, url, index, callback) {
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

export function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

/**
 * Calculate size and proportions of canvas
 */
export function resize(gl, variables) {
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

export function drawScene(gl, items, itemActive, geometrySize, variables, programInfo, buffers) {

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
    let projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument as the destination to receive the result.
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Set the drawing position to the "identity" point, which is the center of the scene.
    let modelViewMatrix = mat4.create();
    let planeRotation = 0.0;
    // Now move the drawing position a bit to where we want to start drawing the square.
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -3.2]);           // amount to translate
    mat4.rotate(modelViewMatrix, modelViewMatrix, planeRotation, [0, 0, 1]);       // axis to rotate around (Z)
    mat4.rotate(modelViewMatrix, modelViewMatrix, planeRotation * .7, [0, 1, 0]);  // axis to rotate around (X)

    // Scale along axis X
    let koefX = gl.canvas.clientWidth / gl.canvas.clientHeight;
    mat4.scale(modelViewMatrix, modelViewMatrix, [koefX, 1, 1]);

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
