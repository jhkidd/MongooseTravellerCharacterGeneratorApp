import injuryTable from './tables/injury.json';
import type { EffectNode } from '../models/effect-types';

interface TableEntry {
  description: string;
  severity?: string;
  effects: EffectNode;
}

interface SharedTable {
  table: string;
  description: string;
  rollType: string;
  entries: Record<string, TableEntry>;
}

const tables: Record<string, SharedTable> = {
  injury: injuryTable as unknown as SharedTable,
};

export function getSharedTable(tableId: string): SharedTable | null {
  return tables[tableId] ?? null;
}

export function getTableEntry(tableId: string, roll: number): TableEntry | null {
  const table = getSharedTable(tableId);
  if (!table) return null;
  return table.entries[String(roll)] ?? null;
}
