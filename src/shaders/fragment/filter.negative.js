export let fragmentFilterNegative = function(){
    return {
        function: ''+
        'vec4 filter(vec4 color) { \n' +
            'color = vec4(1.-color.r, 1.-color.g, 1.-color.b, 1.); \n' +
            'return color; \n' +
        '} \n'
    }
}