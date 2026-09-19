import type { Room, Storage } from '../../types';

export function storageRoot(id: string, storages: Storage[]): string {
  const byId = new Map(storages.map(s => [s.id, s]));
  const seen = new Set<string>();
  let current = id;
  while (byId.get(current)?.parentStorageId) {
    seen.add(current);
    const parent = byId.get(current)!.parentStorageId!;
    if (seen.has(parent) || !byId.has(parent)) break;
    current = parent;
  }
  return current;
}

export function roomLayout(room: Room, index: number, storageCount: number) {
  const saved = [room.floorplanX, room.floorplanY, room.floorplanWidth, room.floorplanHeight].every(v => Number.isFinite(v));
  const width = saved ? Math.max(.1, room.floorplanWidth! / 100) : Math.max(4, Math.ceil(Math.sqrt(storageCount)) * 1.5 + 1);
  const depth = saved ? Math.max(.1, room.floorplanHeight! / 100) : Math.max(3, Math.ceil(storageCount / Math.max(1, Math.floor((width-1)/1.5))) * 1.4 + 1);
  return { saved, x: saved ? room.floorplanX! / 100 : index * (width + 1.5), z: saved ? room.floorplanY! / 100 : 0, width, depth, rotation: (room.floorplanRotation || 0) * Math.PI / 180 };
}

export function storageKind(storage: Pick<Storage, 'name' | 'icon'>) {
  if (/衣柜|衣橱/.test(storage.name) || storage.icon === '📁') return 'wardrobe';
  if (/抽屉/.test(storage.name)) return 'drawers';
  if (/书架|置物架|鞋柜/.test(storage.name) || storage.icon === '📚') return 'shelf';
  return 'box';
}
