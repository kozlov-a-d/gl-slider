// Slider initilaze

let sliderOptions = {
    dots: true,
    animationSpeed: 800,
    effects: {
        filter: 'base',        // base | monochrome | negative | sepia
        slide: 'zoomBlur'      // base | zoomBlur | fragmentParalax | wave
    }
};
let slider = new glSlider(document.getElementById('slider'), sliderOptions);

// DAT.GUI

let gui = new dat.GUI();

let controllerFilter = gui.add(sliderOptions.effects, 'filter', ['base', 'monochrome', 'negative', 'sepia']);
controllerFilter.onFinishChange(function () {
    slider.update(sliderOptions);
});

let controllerSlide = gui.add(sliderOptions.effects, 'slide', ['base', 'wave', 'zoomBlur', 'fragmentParalax']);
controllerSlide.onFinishChange(function () {
    slider.update(sliderOptions);
});

let controllerSpeed = gui.add(sliderOptions, 'animationSpeed', 0, 1500);
controllerSpeed.onFinishChange(function () {
    slider.update(sliderOptions);
});

// Menu scroll

