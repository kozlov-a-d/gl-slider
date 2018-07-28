export let fragmentSlideZoomBlur = function(isIdle){
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
}