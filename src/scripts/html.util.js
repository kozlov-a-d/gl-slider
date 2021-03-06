import * as HandlersUtil from './handlers.util';

const blockClass = 'gl-slider';

/**
 * Create canvas, append to DOM and add events listeners
 */
export function createCanvas(rootEl) {
    let canvas = document.createElement('canvas');
    rootEl.appendChild(canvas);


    return canvas;
}

export function createPreloader(rootEl) {
    let preloader = document.createElement('div');
    preloader.classList.add(blockClass + '__preloader');

    let spinner = document.createElement('div');
    spinner.classList.add(blockClass + '__preloader-spinner');

    preloader.appendChild(spinner);
    rootEl.appendChild(preloader);

    return preloader;
}

export function removePreloader(el) {
    el.remove();
}

/**
 * Create Arrows, append to DOM and add events listeners
 */
export function createArrows(rootEl) {
    let arrows = document.createElement('div');
    arrows.classList.add(blockClass + '__arrows');

    let arrowNext = document.createElement('button');
    arrowNext.classList.add(blockClass + '__arrows-btn');
    arrowNext.classList.add('-next');
    arrowNext.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="10 18 16 12 10 6"></polyline></svg>';

    let arrowPrev = document.createElement('button');
    arrowPrev.classList.add(blockClass + '__arrows-btn');
    arrowPrev.classList.add('-prev');
    arrowPrev.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="14 18 8 12 14 6"></polyline></svg>';

    arrows.appendChild(arrowPrev);
    arrows.appendChild(arrowNext);
    rootEl.appendChild(arrows);

    return {
        prev: arrowPrev,
        next: arrowNext
    };
}

/**
 * Create Dots, append to DOM and add events listeners
 */
export function createDots(rootEl, items, itemActive) {
    let dots = document.createElement('div');
    dots.classList.add(blockClass + '__dots');

    for (let i = 0; i < items.length; i++) {
        let dot = document.createElement('button');
        dot.classList.add(blockClass + '__dot');
        if (i === itemActive) {
            dot.classList.add('is-active');
        }
        dot.setAttribute('data-dot-number', i.toString());
        dot.innerHTML = 'i';
        HandlersUtil.addHandlersNavigationDots(dot, i);
        dots.appendChild(dot);
    }

    rootEl.appendChild(dots);

    return dots;
}
