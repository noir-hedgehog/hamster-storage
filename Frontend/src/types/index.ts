export interface Location {
  id: string;
  name: string;
  type: 'location';
  icon?: string;
  mapX?: number;
  mapY?: number;
}

export type RoomGeometry = {unit:'cm';x:number;y:number;width:number;depth:number;height?:number;rotation:number};
export type Furniture = {id:string;name:string;roomId:string;kind:'bed'|'sofa'|'table'|'chair'|'wardrobe'|'shelf'|'drawers'|'appliance'|'box'|'other';unit:'cm';width:number;depth:number;height:number;x:number;y:number;rotation:number;storageId?:string|null;description?:string};
export interface Room {
  geometry?: RoomGeometry;
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
}

export interface Storage {
  id: string;
  created_at?: string;
  updated_at?: string;
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

export interface ItemTemplate {
  id: string;
  name: string;
  categoryId?: string;
  defaultAttributes?: Record<string, string>;
  defaultTags?: string[];
  defaultPrice?: number;
  defaultUnit?: string;
  defaultBrand?: string;
  defaultDescription?: string;
  createdAt?: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  storageId: string;
  categoryId?: string; // 分类 ID（每个物品只属于一个分类）
  attributes: Record<string, string>;
  tags: string[]; // 标签 ID 数组（一个物品可以有多个标签）
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
  color?: string;
  brand?: string;
  created_at?: string;
  updated_at?: string;
}

export type TreeNode = Location | Room | Storage;

export interface Alert {
  id: string;
  itemId: string;
  itemName: string;
  type: 'expiring' | 'expired' | 'low-stock' | 'overstock';
  severity: 'high' | 'medium' | 'low';
  message: string;
  date: string;
}

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: string[];
}
