export let fragmentFilterSepia = function(){
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
}