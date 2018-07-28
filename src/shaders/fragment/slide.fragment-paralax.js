export let fragmentSlideFragmentparalax = function(isIdle){
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
}