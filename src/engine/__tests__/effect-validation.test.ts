import { describe, it, expect } from 'vitest';
import { interpretEffect } from '../effect-interpreter';
import { getAllCareerIds, loadCareer } from '../../data/career-loader';
import { createBlankCharacter } from '../../models/types';
import type { Character } from '../../models/types';
import type { EffectNode } from '../../models/effect-types';

/** Character with moderate stats and some skills - exercises most branches. */
function makeTestCharacter(): Character {
  return {
    ...createBlankCharacter(),
    characteristics: { STR: 8, DEX: 8, END: 8, INT: 8, EDU: 8, SOC: 8 },
    skills: { Recon: 1, Streetwise: 1, Deception: 1, Athletics: 1, 'Gun Combat': 0 },
  };
}

/** Character with no skills - tests fallback paths. */
function makeBareCharacter(): Character {
  return {
    ...createBlankCharacter(),
    characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
  };
}

/**
 * Recursively verify all branches of an effect tree can be interpreted
 * without throwing. For skillCheck nodes, also verify success/failure branches.
 */
function verifyEffectTree(node: EffectNode, character: Character, path: string) {
  const result = interpretEffect(node, character);
  expect(result, `interpretEffect failed at ${path}`).toBeDefined();
  expect(result.type, `unexpected result type at ${path}`).toMatch(/^(immediate|pause)$/);

  // Recursively check branches for interactive types
  if (node.type === 'skillCheck') {
    verifyEffectTree(node.success, character, `${path}.success`);
    verifyEffectTree(node.failure, character, `${path}.failure`);
    if (node.naturalTwo) {
      verifyEffectTree(node.naturalTwo, character, `${path}.naturalTwo`);
    }
  }

  if (node.type === 'choice') {
    for (let i = 0; i < node.options.length; i++) {
      for (const effect of node.options[i].effects) {
        verifyEffectTree(effect, character, `${path}.options[${i}]`);
      }
    }
  }

  if (node.type === 'pickOne') {
    for (let i = 0; i < node.options.length; i++) {
      verifyEffectTree(node.options[i].effect, character, `${path}.pickOne[${i}]`);
    }
  }

  if (node.type === 'compound') {
    for (let i = 0; i < node.effects.length; i++) {
      verifyEffectTree(node.effects[i], character, `${path}.compound[${i}]`);
    }
  }
}

describe('Event and mishap effect validation', () => {
  const careerIds = getAllCareerIds();
  const skilledChar = makeTestCharacter();
  const bareChar = makeBareCharacter();

  for (const careerId of careerIds) {
    const career = loadCareer(careerId);

    describe(`${career.name} events`, () => {
      for (const [roll, event] of Object.entries(career.events)) {
        it(`event ${roll}: "${event.description.slice(0, 60)}..." interprets without error`, () => {
          verifyEffectTree(event.effects, skilledChar, `${careerId}.events[${roll}]`);
        });

        it(`event ${roll}: interprets with bare character (no skills)`, () => {
          verifyEffectTree(event.effects, bareChar, `${careerId}.events[${roll}].bare`);
        });
      }
    });

    describe(`${career.name} mishaps`, () => {
      for (const [roll, mishap] of Object.entries(career.mishaps)) {
        it(`mishap ${roll}: "${mishap.description.slice(0, 60)}..." interprets without error`, () => {
          verifyEffectTree(mishap.effects, skilledChar, `${careerId}.mishaps[${roll}]`);
        });

        it(`mishap ${roll}: interprets with bare character (no skills)`, () => {
          verifyEffectTree(mishap.effects, bareChar, `${careerId}.mishaps[${roll}].bare`);
        });
      }
    });
  }
});
