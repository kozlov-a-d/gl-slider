export let vertexBase = function(){
    return ''+
    'attribute vec4 a_position; \n'+         // положение прямоугольника?
    'attribute vec2 a_texcoord; \n'+     // положение текстуры?

    'uniform mat4 uProjectionMatrix; \n'+          // состояние перехода между слайдами
    'uniform mat4 uModelViewMatrix; \n'+          // состояние перехода между слайдами
    'uniform float u_progress; \n'+
    'uniform float u_time; \n'+              // время
    // 'uniform vec2  u_mouse; \n'+             // положение курсора мыши в пикселях относительно блока
    'uniform vec2  u_blockRatio; \n'+         // коэффициенты размеров блока
    'uniform vec2  u_texRatio0; \n'+      // коэффициенты размеров картинки

    'varying vec2 uv; \n' +
    'varying highp vec2 v_texcoord; \n' +
    'varying vec2 v_position; \n' +
    'varying float v_progress; \n'+          // состояние перехода между слайдами
    'varying float v_time; \n'+              // время
    // 'varying vec2  v_mouse; \n'+             // положение курсора мыши [0...1], меняется центр координат


    'void main() { \n'+

        'uv = vec2( a_texcoord.x , ( 1. - a_texcoord.y) );\n' +
        'vec2 vUv = (( uv - 0.5 ) / u_blockRatio.xy / u_texRatio0.xy ) +  0.5;\n' +

        'v_texcoord = vUv;' +
        'v_position = a_position.xy;' +
        'v_progress = u_progress; \n'+
        // 'v_time = u_time; \n'+
        'gl_Position = uProjectionMatrix * uModelViewMatrix * a_position;' +
    '}'
}