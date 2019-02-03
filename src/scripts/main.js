/**
 * @fileoverview glsl-slider - High performance matrix and vector operations
 * @author Andrey Kozlov
 * @version 0.0.1
 */

/* Copyright (c) 2015-2018, Brandon Jones, Colin MacKenzie IV.
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of
the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL T
HE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE. */

import * as webglUtil from './webgl.util';
import * as handlersUtil from './handlers.util';
import * as htmlUtil from './html.util';
import * as helper from './other.util';
import { shaders } from '../shaders/shaders';

import '../styles/main.scss';

export default class webglSlider {

    constructor(rootEl, options) {

        this.defaults = {
            effects: {
                filter: 'base',
                slide: 'base'
            },
            animationSpeed: 500,
            arrows: true,
            dots: false,
            autoplay: false,
            autoplaySpeed: 3000,
            preloader: true,
            startItem: 0
        };
        this.html = {
            root: rootEl,
            canvas: null,
            preloader: null,
            arrows: null,
            dots: null
        };
        this.geometrySize = {
            x: 1,
            y: 1
        };
        this.items = [];
        this.variables = {
            progress: 0,
            time: 0,
            canvasSize: {
                width: 0,
                height: 0
            },
            canvasRatio: {
                width: 1,
                height: 1
            },
            texRatio0: {
                width: 1,
                height: 1
            },
            texRatio1: {
                width: 1,
                height: 1
            },
            mouse: {
                state: 'out',
                x: 0,
                y: 0
            }
        };
        this.options = helper.mergeDeep(this.defaults, options);
        this.animate = {
            isActive: false,
            currTime: 0,
            totalTime: this.options.animationSpeed
        };

        let self = this;  // save this context

        if (self.options.preloader) {
            self.html.preloader = htmlUtil.createPreloader(self.html.root);
        }

        self.html.canvas = htmlUtil.createCanvas(self.html.root);
        handlersUtil.addHandlersCanvas(self.html.canvas, self.variables);

        self.gl = webglUtil.initGL(self.html.canvas);
        self.programInfo = webglUtil.initShaderProgram(
            self.gl,
            shaders.vertex.base(),
            webglUtil.combineFragmentShader(self.options.effects)
        );
        self.buffers = webglUtil.initBuffers(self.gl, self.geometrySize); // инициализируем плоскость

        self.loadItems(function () {
            self.sortItems();

            self.itemActive = self.options.startItem; // задаём начальный слайд
            self.generateArrow();
            self.generateDots();
            self.slide(0, 0, 1, 1); // инициализируем начальный слайд

            let then = 0;
            // Draw the scene repeatedly
            function render(now) {
                // now *= 0.001;  // convert to seconds
                let deltaTime = now - then;
                then = now;

                if(self.animate.isActive){
                    self.animate.currTime += deltaTime;
                    self.variables.progress = self.animate.currTime/self.animate.totalTime;
                }

                if( self.variables.progress >= 1 ){
                    self.variables.progress = 0;
                    self.animate.isActive = false;
                    self.changeImage(self.itemActive, self.itemActive, null);

                    if (self.options.dots) {
                        self.html.dots.querySelectorAll('button').forEach(element=>{
                            element.classList.remove('is-active');
                            if(parseInt(element.dataset.dotNumber) === self.itemActive ){
                                element.classList.add('is-active');
                            }
                        });
                    }
                }

                webglUtil.drawScene(self.gl, self.items, self.itemActive, self.geometrySize, self.variables, self.programInfo, self.buffers, deltaTime);

                requestAnimationFrame(render);
            }
            requestAnimationFrame(render);

            if (self.options.preloader) {
                htmlUtil.removePreloader(self.html.preloader);
            }

            self.html.root.dataset.initialized = 'true';
        });
    }

    /**
     * Update plugin options and shader program
     * @param options
     */
    update(options) {
        this.options = helper.mergeDeep(this.defaults, options);
        this.programInfo = webglUtil.initShaderProgram(
            this.gl,
            shaders.vertex.base(),
            webglUtil.combineFragmentShader(this.options.effects)
        );
    }

    /**
     * загружаем все картинки, проверяя доступны ли они,
     * если не 404, то добавляем их в this.items[] 
     */
    loadItems(callback) {

        // items = [];
        let textureList = this.html.root.querySelectorAll('[data-item]');
        // console.log(textureList);
        let total = textureList.length;
        let done = 0;
        let fail = 0;

        function loaded(state) {
            if (state === 'done') {
                done++;
            } else {
                fail++;
            }
            if (done + fail === total) {
                setTimeout(function () {
                    callback();
                }, 20);
            }
        }

        textureList.forEach((element,index) => {
            let texture = element.querySelector('img, video');

            if (texture.tagName === 'IMG' || texture.tagName === 'img') {
                let url = new URL(texture.src);
                this.items.push(webglUtil.loadTexture(this.gl, url, index, loaded));
            }
        });
    }

    /**
     * Sorting items
     */
    sortItems(){
        function compareIndex(itemA, itemB) {
            return itemA.index - itemB.index;
        }
        this.items.sort(compareIndex);
    }

    changeImage(curr, next, dir) {
        // Tell WebGL we want to affect texture unit 0
        this.gl.activeTexture(this.gl.TEXTURE0);
        // Bind the texture to texture unit 0
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.items[curr].texture);
        // Tell WebGL we want to affect texture unit 1
        this.gl.activeTexture(this.gl.TEXTURE1);
        // Bind the texture to texture unit 0
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.items[next].texture);
    }

    // TODO: усложнить логику, сейчас только loop, а может быть не зацикленный слайдер
    /**
     * Общая функция для перехода между слайдами
     */
    slide(curr, next, dir, time) {
        let self = this;  // save this context

        time = (time >= 0) ? time : this.options.animationSpeed;

        self.changeImage(curr, next, dir);

        self.animate.isActive = true;
        self.animate.currTime = 0;
        self.animate.totalTime = time;
        self.variables.progress = 0; // progress calculation is in requestAnimationFrame

        self.itemActive = next;
    }

    /**
     * Goes to item number X
     * @param number - next item
     */
    slideTo(number) {
        let self = this;  // save this context
        if (0 <= number && number < self.items.length) {
            self.slide(self.itemActive, number, 1);
        }
    }

    /**
     * Goes to next item
     */
    slideNext(){
        if (this.itemActive + 1 < this.items.length) {
            this.slide(this.itemActive, this.itemActive + 1, 1);
        } else {
            this.slide(this.itemActive, 0, 1);
        }
    }

    /**
     * Goes to previous item
     */
    slidePrev() {
        if (this.itemActive - 1 >= 0) {
            this.slide(this.itemActive, this.itemActive - 1, 1);
        } else {
            this.slide(this.itemActive, this.items.length - 1, 1);
        }
    }

    generateArrow(){
        let self = this;  // save this context
        if (this.options.arrows) {
            this.html.arrows = htmlUtil.createArrows(this.html.root);
            handlersUtil.addHandlersNavigationArrows({
                prev: this.html.arrows.prev,
                prevAction: function () {
                    self.slidePrev();
                },
                next: this.html.arrows.next,
                nextAction: function () {
                    self.slideNext();
                }
            });
        }
    }

    generateDots(){
        let self = this;  // save this context
        if (this.options.dots) {
            this.html.dots = htmlUtil.createDots(this.html.root, this.items, this.options.startItem);
            self.html.dots.querySelectorAll('button').forEach(element=>{
                handlersUtil.addHandlersNavigationDots(element, function () {
                    self.slideTo(parseInt(element.dataset.dotNumber));
                });
            });
        }
    }
}
