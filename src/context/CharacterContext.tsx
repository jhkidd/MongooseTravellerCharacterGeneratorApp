import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { characterReducer, type CharacterAction } from '../engine/character-reducer';
import { createBlankCharacter } from '../models/types';
import type { Character } from '../models/types';

interface CharacterContextValue {
  character: Character;
  dispatch: Dispatch<CharacterAction>;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [character, dispatch] = useReducer(characterReducer, undefined, createBlankCharacter);

  return (
    <CharacterContext.Provider value={{ character, dispatch }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter(): CharacterContextValue {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }

  return ctx;
}
