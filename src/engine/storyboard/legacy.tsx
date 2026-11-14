import React from 'react';
import {PlanetFormation} from '../../compositions/PlanetFormation';
import {parseScenePlan, type ScenePlan} from '../../schemas/scene-plan';

/** Versioned compatibility boundary; no generic conversion of approved choreography. */
export const adaptPlanetFormation = (value: unknown) => ({kind: 'planet-formation-v1' as const, plan: parseScenePlan(value)});
export const LegacyStoryboard: React.FC<{plan: ScenePlan}> = ({plan}) => <PlanetFormation plan={plan}/>;
