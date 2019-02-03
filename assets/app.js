// Slider initilaze

let sliderOptions = {
    dots: true,
    animationSpeed: 800,
    renderInView: true, // render only when slider visible
    effects: {
        filter: 'base',        // base | monochrome | negative | sepia
        slide: 'zoomBlur'      // base | zoomBlur | fragmentParalax | wave
    }
};
let slider = new glSlider(document.getElementById('slider'), sliderOptions);

// DAT.GUI

let gui = new dat.GUI();

let customContainer = document.getElementById('my-gui-container');
customContainer.appendChild(gui.domElement);

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

(()=>{
    
    const anchors = document.querySelectorAll('a[href*="#"]')

    for (let anchor of anchors) {
        anchor.addEventListener('click', (e) => {
            e.preventDefault()
            
            const blockID = anchor.getAttribute('href')
            
            document.querySelector('' + blockID).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        })
    }

})();