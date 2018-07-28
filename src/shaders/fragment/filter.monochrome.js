export let fragmentFilterMonochrome = function(){
    return {
        function: ''+
        'vec4 filter(vec4 color) { \n' +
            'float middle = ( 3.*color.r + 6.*color.g + color.b )/10.; \n' +
            'color = vec4(middle, middle, middle, 1.); \n' +
            'return color; \n' +
        '} \n'
    }
}