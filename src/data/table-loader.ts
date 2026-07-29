import injuryTable from './tables/injury.json';
import lifeEventsTable from './tables/life-events.json';
import type { EffectNode } from '../models/effect-types';
import type { CareerData } from '../models/career-types';

export interface TableEntry {
  description: string;
  severity?: string;
  effects: EffectNode;
}

export interface SharedTable {
  table: string;
  description: string;
  rollType: string;
  entries: Record<string, TableEntry>;
}

const tables: Record<string, SharedTable> = {
  injury: injuryTable as unknown as SharedTable,
  'life-events': lifeEventsTable as unknown as SharedTable,
  // TODO: Add 'rogue-or-citizen-events' and 'rogue-or-citizen-mishap' tables
  // once Rogue and Citizen careers are implemented (needed by Agent event 8).
};

export function getSharedTable(tableId: string): SharedTable | null {
  return tables[tableId] ?? null;
}

export function getTableEntry(tableId: string, roll: number): TableEntry | null {
  const table = getSharedTable(tableId);
  if (!table) return null;
  return table.entries[String(roll)] ?? null;
}

/**
 * Build a SharedTable from a career's mishap entries so that
 * `rollOnTable` with `table: "mishap"` can resolve against the
 * current career's mishap data.
 */
export function buildCareerMishapTable(career: CareerData): SharedTable {
  const entries: Record<string, TableEntry> = {};
  for (const [roll, mishap] of Object.entries(career.mishaps)) {
    entries[roll] = {
      description: mishap.description,
      effects: mishap.effects,
    };
  }
  return {
    table: `${career.id}-mishap`,
    description: `Mishap table for ${career.name}`,
    rollType: '1D6',
    entries,
  };
}
