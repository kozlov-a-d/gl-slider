# GLSL Slider

GLSL Slider is a easy to use slider with awesome transition effects, which use glsl shaders. 

[Demo](https://kozlov-a-d.github.io/glsl-slider/)
### How to use

```
<script src="build/main.js"></script>
<script>
    let sliderOptions = {
        dots: true,
        animationSpeed: 800,
        effects: {
            filter: 'base',        // base | monochrome | negative | sepia
            slide: 'zoomBlur'      // base | zoomBlur | fragmentParalax | wave
        }
    };
</script>
```

### License
Copyright (c) 2018 Andrey Kozlov
Licensed under the MIT license.
