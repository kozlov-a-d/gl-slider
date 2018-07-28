export let fragmentFilterBase = function(){
    return {
        function: ''+
        'vec4 filter(vec4 color) { \n' +
            'return color; \n' +
        '} \n'
    }
}