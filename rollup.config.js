import browsersync from 'rollup-plugin-browsersync';

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
	],
	watch: {
		chokidar: {
		  // if the chokidar option is given, rollup-watch will
		  // use it instead of fs.watch. You will need to install
		  // chokidar separately.
		  //
		  // this options object is passed to chokidar. if you
		  // don't have any options, just pass `chokidar: true`
		},
	
		// include and exclude govern which files to watch. by
		// default, all dependencies will be watched
		exclude: ['node_modules/**']
	},
	plugins: [
	  browsersync({server: '.'})
	]
};
