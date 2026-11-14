import type {IllustrationLayerRole} from './IllustrationLayer';

export type IllustrationDefinition={id:string;version:'1.0';category:string;layers:ReadonlyArray<{id:string;role:IllustrationLayerRole}>};
const definitions=new Map<string,IllustrationDefinition>();

export const registerIllustration=(definition:IllustrationDefinition)=>{if(definitions.has(definition.id))throw new Error(`Illustration already registered: ${definition.id}`);definitions.set(definition.id,definition);return definition;};
export const getIllustrationDefinition=(id:string)=>definitions.get(id);
export const listIllustrations=()=>Array.from(definitions.values());

export const starDefinition=registerIllustration({id:'space.illustrated-star',version:'1.0',category:'space',layers:[{id:'atmosphere',role:'atmosphere'},{id:'corona-drift',role:'atmosphere'},{id:'approved-artwork',role:'material'}]});
export const rockyPlanetDefinition=registerIllustration({id:'space.rocky-planet',version:'1.0',category:'space',layers:[{id:'atmosphere',role:'atmosphere'},{id:'growing-body',role:'silhouette'},{id:'approved-surface',role:'material'},{id:'formation-fractures',role:'highlight'},{id:'rim-light',role:'rim'}]});
export const asteroidDefinition=registerIllustration({id:'space.asteroid',version:'1.0',category:'space',layers:[{id:'body',role:'silhouette'},{id:'facets',role:'material'},{id:'occlusion',role:'shadow'},{id:'craters',role:'texture'},{id:'edge-light',role:'highlight'}]});
export const protoplanetaryDiskDefinition=registerIllustration({id:'space.protoplanetary-disk',version:'1.0',category:'space',layers:[{id:'far-dust-haze',role:'atmosphere'},{id:'far-orbital-bands',role:'material'},{id:'far-grains',role:'texture'},{id:'near-dust-haze',role:'foreground'},{id:'near-orbital-bands',role:'foreground'},{id:'near-grains',role:'foreground'},{id:'stellar-pickup',role:'highlight'}]});
