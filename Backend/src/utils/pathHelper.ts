import { LocationModel } from '../models/LocationModel';
import { RoomModel } from '../models/RoomModel';
import { StorageModel } from '../models/StorageModel';

export function getStoragePath(storageId: string): string {
  const storage = StorageModel.findById(storageId);
  if (!storage) return '';

  const room = RoomModel.findById(storage.roomId);
  if (!room) return storage.name;

  const location = LocationModel.findById(room.locationId);
  if (!location) return `${room.name} / ${storage.name}`;

  return `${location.name} / ${room.name} / ${storage.name}`;
}
