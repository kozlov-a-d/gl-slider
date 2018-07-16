import * as webglUtil from './webgl.util';
import * as handlersUtil from './handlers.util';
import * as htmlUtil from './html.util';
import * as helper from './other.util';
import { shaders } from '../shaders/shaders';

export default class Slider {

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
            x: 30,
            y: 20
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
            self.slide(0, 0, 1, 0); // инициализируем начальный слайд

            let then = 0;
            // Draw the scene repeatedly
            function render(now) {
                now *= 0.001;  // convert to seconds
                let deltaTime = now - then;
                then = now;

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

    // TODO: усложнить логику, сейчас только loop, а может быть не зацикленный слайдер
    /**
     * Общая функция для перехода между слайдами
     */
    slide(curr, next, dir, time) {

        let self = this;  // save this context

        time = (time >= 0) ? time : this.options.animationSpeed;

        if (time === 0) {
            changeImage(curr, curr, dir);
            self.variables.progress = 0;
            self.itemActive = next;
        } else {
            changeImage(curr, next, dir);

            animateNumber(self.variables.progress, 0, 1, time, function () {
                changeImage(next, next, dir);
                self.variables.progress = 0;
                self.itemActive = next;

                if (self.options.dots) {
                    self.html.root.querySelectorAll('[data-dot-number]').forEach(element=>{
                        element.classList.remove('is-active');
                    });
                    self.html.root.querySelector('[data-dot-number=' + self.itemActive + ']').classList.add('is-active');
                }

            });

        }

        function animateNumber(where, from, to, time, cb) {
            // let start = new Date().getTime();
            //
            // function delta(_progress) {
            //     return Math.pow(_progress, 2);
            // }
            //
            // setTimeout(function () {
            //     let now = (new Date().getTime()) - start;
            //     let _progress = now / time;
            //     let result = (to - from) * delta(_progress) + from;
            //     self.variables.progress = (result > 1) ? 1 : result;
            //
            //     if (_progress < 1) {
            //         setTimeout(arguments.callee, 5);
            //     } else {
            //         cb();
            //     }
            // }, 10);

        }

        function changeImage(curr, next, dir) {
            console.log('curr', self.items[curr]);
            console.log('next', self.items[next]);
            // Tell WebGL we want to affect texture unit 0
            self.gl.activeTexture(self.gl.TEXTURE0);
            // Bind the texture to texture unit 0
            self.gl.bindTexture(self.gl.TEXTURE_2D, self.items[curr].texture);
            // Tell WebGL we want to affect texture unit 1
            self.gl.activeTexture(self.gl.TEXTURE1);
            // Bind the texture to texture unit 0
            self.gl.bindTexture(self.gl.TEXTURE_2D, self.items[next].texture);
        }

    }

    /**
     * Goes to item number X
     * @param number - next item
     */
    slideTo(number) {
        if (0 <= number && number < this.items.length) {
            this.slide(this.itemActive, number, 1);
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
                    self.slidePrev()
                },
                next: this.html.arrows.next,
                nextAction: function () {
                    self.slideNext
                }
            });
        }
    }

    generateDots(){
        if (this.options.dots) {
            this.html.dots = htmlUtil.createDots(this.html.root, this.items, this.options.startItem);
        }
    }

    test() {
        console.log('I\'m slider');
        console.log(this.options);
    }
}
