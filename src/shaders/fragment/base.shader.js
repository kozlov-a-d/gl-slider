export let fragmentBase = function(effects){
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
}