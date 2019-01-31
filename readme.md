# WebGL Slider

WebGL Slider is a easy to use slider with awesome transition effects, which use glsl shaders. 

[Demo](https://kozlov-a-d.github.io/webgl-slider/)

### How to use

```
<script src="build/main.js"></script>
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
    let slider = new webglSlider(document.getElementById('slider'), sliderOptions);
</script>
```

### License
Copyright (c) 2018 Andrey Kozlov

Licensed under the MIT license.
