// Vertex base shader
import { vertexBase } from './vertex/base.shader';
// Fragment base shader
import { fragmentBase } from './fragment/base.shader';
// Fragment filter shaders
import { fragmentFilterBase } from './fragment/filter.base';
import { fragmentFilterMonochrome } from './fragment/filter.monochrome';
import { fragmentFilterSepia } from './fragment/filter.sepia';
import { fragmentFilterNegative } from './fragment/filter.negative';
// Fragment slide shaders
import { fragmentSlideBase } from './fragment/slide.base';
import { fragmentSlideWave } from './fragment/slide.wave';
import { fragmentSlideZoomBlur } from './fragment/slide.zoome-blur';
import { fragmentSlideFragmentparalax } from './fragment/slide.fragment-paralax';


export let shaders = {
    vertex: {
        base: vertexBase
    },
    fragment: {
        base: fragmentBase,
        filters: {
            base: fragmentFilterBase,
            monochrome: fragmentFilterMonochrome,
            negative: fragmentFilterNegative,
            sepia: fragmentFilterSepia
        },
        slide: {
            base: fragmentSlideBase,
            fragmentParalax: fragmentSlideFragmentparalax,
            wave: fragmentSlideWave,
            zoomBlur: fragmentSlideZoomBlur
        }
    }
}