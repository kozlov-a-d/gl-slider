export default {
    input: 'src/scripts/main.js',
    external: [ 'gl-matrix (' ],
    output: [
		{
			format: 'umd',
			name: 'SliderGLSL',
			file: 'build/main.js',
			indent: '\t'
		},
		{
			format: 'es',
			file: 'build/main.module.js',
			indent: '\t'
		}
	]
};
