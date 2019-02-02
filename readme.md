# GL-Slider

GL-Slider is a easy to use slider with awesome transition effects, which use glsl shaders. 

[Demo](https://kozlov-a-d.github.io/gl-slider/)

### How to use

```
<link href="./your/path/to/build/gl-slider.css" rel="stylesheet">
<script src="./your/path/to/build/gl-slider.js">
<script>
    let sliderOptions = {
        arrows: true,
        dots: true,
        preloader: true,  

        startItem: 0

        animationSpeed: 800,
        effects: {
            filter: 'base',        // base | monochrome | negative | sepia
            slide: 'zoomBlur'      // base | zoomBlur | fragmentParalax | wave
        },
        
        autoplay: false,           // will work later
        autoplaySpeed: 3000,       // will work later
    };
    let slider = new glSlider(document.getElementById('slider'), sliderOptions);
</script>
```

### License
Copyright (c) 2018 Andrey Kozlov

Licensed under the MIT license.

## Thanks
The following libraries / open-source projects / peoples
 * [Yuri Artiukh](https://github.com/akella)
 * [Rollup](https://rollupjs.org)
 * [Sass](http://sass-lang.com/)
 * [Node.js](http://nodejs.org/)
 
