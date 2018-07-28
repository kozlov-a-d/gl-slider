export let fragmentSlideBase = function(isIdle){
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
}