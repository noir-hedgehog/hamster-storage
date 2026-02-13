export interface Location {
  id: string;
  name: string;
  type: 'location';
  icon?: string;
  mapX?: number;
  mapY?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'room';
  locationId: string;
  icon?: string;
  floorplanX?: number;
  floorplanY?: number;
  floorplanWidth?: number;
  floorplanHeight?: number;
  floorplanRotation?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Storage {
  id: string;
  name: string;
  type: 'storage';
  roomId: string;
  parentStorageId?: string; // 支持嵌套收纳
  description?: string;
  icon?: string;
  floorplanX?: number;
  floorplanY?: number;
  floorplanWidth?: number;
  floorplanHeight?: number;
  floorplanRotation?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  parentCategoryId?: string;
  icon?: string;
  description?: string;
  attributesTemplate?: Record<string, string>; // 属性模板：key 为属性名，value 为属性类型或描述
  created_at?: string;
  updated_at?: string;
}

export interface TagGroup {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  tagGroupId?: string;
  color?: string;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  storageId: string;
  categoryId?: string;
  brand?: string;
  color?: string;
  attributes: Record<string, string>;
  tags: string[]; // 标签 ID 数组
  price?: number;
  purchaseDate?: string;
  depreciationRate?: number; // 年折旧率 (0-100)
  expiryDate?: string;
  quantity: number;
  unit?: string;
  minThreshold?: number; // 最小库存阈值
  maxThreshold?: number; // 最大库存阈值
  rfid?: string;
  barcode?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Alert {
  id: string;
  itemId: string;
  itemName: string;
  type: 'expiring' | 'expired' | 'low-stock' | 'overstock';
  severity: 'high' | 'medium' | 'low';
  message: string;
  date: string;
}

// DTOs for creating/updating
export interface CreateLocationDto {
  name: string;
  icon?: string;
}

export interface UpdateLocationDto {
  name?: string;
  icon?: string;
  mapX?: number;
  mapY?: number;
}

export interface CreateRoomDto {
  name: string;
  locationId: string;
  icon?: string;
}

export interface UpdateRoomDto {
  name?: string;
  icon?: string;
  floorplanX?: number;
  floorplanY?: number;
  floorplanWidth?: number;
  floorplanHeight?: number;
  floorplanRotation?: number;
}

export interface CreateStorageDto {
  name: string;
  roomId: string;
  parentStorageId?: string;
  description?: string;
  icon?: string;
}

export interface UpdateStorageDto {
  name?: string;
  parentStorageId?: string;
  description?: string;
  icon?: string;
  floorplanX?: number;
  floorplanY?: number;
  floorplanWidth?: number;
  floorplanHeight?: number;
  floorplanRotation?: number;
}

export interface CreateCategoryDto {
  name: string;
  parentCategoryId?: string;
  icon?: string;
  description?: string;
  attributesTemplate?: Record<string, string>;
}

export interface UpdateCategoryDto {
  name?: string;
  parentCategoryId?: string;
  icon?: string;
  description?: string;
  attributesTemplate?: Record<string, string>;
}

export interface CreateTagGroupDto {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface UpdateTagGroupDto {
  name?: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface CreateTagDto {
  name: string;
  tagGroupId?: string;
  color?: string;
  icon?: string;
}

export interface UpdateTagDto {
  name?: string;
  tagGroupId?: string;
  color?: string;
  icon?: string;
}

export interface CreateItemDto {
  name: string;
  description?: string;
  storageId: string;
  categoryId?: string;
  brand?: string;
  color?: string;
  attributes?: Record<string, string>;
  tagIds?: string[]; // 标签 ID 数组
  price?: number;
  purchaseDate?: string;
  depreciationRate?: number;
  expiryDate?: string;
  quantity?: number;
  unit?: string;
  minThreshold?: number;
  maxThreshold?: number;
  rfid?: string;
  barcode?: string;
  images?: string[];
}

export interface UpdateItemDto {
  name?: string;
  description?: string;
  storageId?: string;
  categoryId?: string;
  brand?: string;
  color?: string;
  attributes?: Record<string, string>;
  tagIds?: string[]; // 标签 ID 数组
  price?: number;
  purchaseDate?: string;
  depreciationRate?: number;
  expiryDate?: string;
  quantity?: number;
  unit?: string;
  minThreshold?: number;
  maxThreshold?: number;
  rfid?: string;
  barcode?: string;
  images?: string[];
}
