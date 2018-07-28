export let fragmentSlideWave = function(isIdle){
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
}