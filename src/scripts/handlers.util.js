/**
 * Add handlers
 */
export function addHandlersCanvas(el, variables) {
    addHandlerOnMouseEnter(el, variables);
    addHandlerOnMouseOut(el, variables);
    addHandlerOnMouseMove(el, variables);
}

export function addHandlerOnMouseEnter(el, variables) {
    el.addEventListener('mouseenter', function(e){
        variables.mouse.state = 'enter';
        variables.mouse.x = e.offsetX;
        variables.mouse.y = e.offsetY;
    })
}

export function addHandlerOnMouseOut(el, variables) {
    el.addEventListener('mouseout', function(e){
        variables.mouse.state = 'out';
        variables.mouse.x = e.offsetX;
        variables.mouse.y = e.offsetY;
    });
}

export function addHandlerOnMouseMove(el, variables) {
    el.addEventListener('mousemove', function(e){
        variables.mouse.state = 'enter';
        variables.mouse.x = e.offsetX;
        variables.mouse.y = e.offsetY;
    });
}

export function addHandlersNavigationArrows(arrows) {
    arrows.prev.addEventListener('click', function(){
        arrows.prevAction();
    });
    arrows.next.addEventListener('click', function(){
        arrows.nextAction();
    });
}

export function addHandlersNavigationDots(btn, callback) {
    btn.addEventListener('click', function(){
        callback();
    });
}
