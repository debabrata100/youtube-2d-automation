import type {Point} from './paths';
export const cameraTransform = (focus: Point, zoom: number, viewport={x:540,y:960}) => `translate(${viewport.x}px, ${viewport.y}px) scale(${zoom}) translate(${-focus.x}px, ${-focus.y}px)`;
