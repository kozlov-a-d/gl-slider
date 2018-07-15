export default {
    input: 'src/scripts/main.js',
    output: [
		{
			format: 'umd',
			name: 'glslSlider',
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