(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.glslSlider = factory());
}(this, (function () { 'use strict';

	class Slider{
	    constructor(){
	        
	    }

	    test(){
	        console.log('I\'m slider');
	    }
	}

	return Slider;

})));
