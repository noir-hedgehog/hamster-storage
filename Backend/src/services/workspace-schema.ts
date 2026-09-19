import { z } from 'zod';
import { furnitureSchema, geometrySchema } from '../models/SpaceModel';

const name = z.string().trim().min(1).max(300);
const id = z.string().min(1).max(200);
const text = z.string().max(10000);
const coordinate = z.number().finite().min(-100000).max(100000);
const count = z.number().int().min(0).max(1000000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}, '日期不存在');
const legacyLayout = {
  floorplanX: coordinate.optional(), floorplanY: coordinate.optional(),
  floorplanWidth: z.number().finite().positive().max(100000).optional(),
  floorplanHeight: z.number().finite().positive().max(100000).optional(),
  floorplanRotation: z.number().finite().min(-360).max(360).optional(),
};

export const createSchemas = {
  locations: z.object({name,icon:name.optional()}).strict(),
  rooms: z.object({name,locationId:id,icon:name.optional(),...legacyLayout,geometry:geometrySchema.optional()}).strict(),
  storages: z.object({name,roomId:id,parentStorageId:id.optional(),description:text.optional(),icon:name.optional(),...legacyLayout}).strict(),
  furniture: furnitureSchema,
  items: z.object({
    name,storageId:id,description:text.optional(),categoryId:id.optional(),brand:z.string().trim().max(300).optional(),color:z.string().trim().max(300).optional(),
    attributes:z.record(z.string().max(100),z.string().max(2000)).optional(),
    tagIds:z.array(id).max(100).optional(),price:z.number().finite().min(0).max(1e9).optional(),
    purchaseDate:date.optional(),expiryDate:date.optional(),depreciationRate:z.number().min(0).max(100).optional(),
    quantity:count.min(1).default(1),unit:name.optional(),minThreshold:count.optional(),maxThreshold:count.optional(),
    rfid:name.optional(),barcode:name.optional(),images:z.array(z.string().url().max(2000)).max(20).optional(),
  }).strict(),
  categories:z.object({name,parentCategoryId:id.optional(),icon:name.optional(),description:text.optional(),attributesTemplate:z.record(z.string().max(100),z.string().max(1000)).optional()}).strict(),
  tags:z.object({name,tagGroupId:id.optional(),color:name.optional(),icon:name.optional()}).strict(),
  tag_groups:z.object({name,color:name.optional(),icon:name.optional(),description:text.optional()}).strict(),
};
export const entities = ['locations','rooms','storages','furniture','items','categories','tags','tag_groups'] as const;
export type Entity = typeof entities[number];
export const entitySchema = z.enum(entities);
export const updateSchemas = {
  ...Object.fromEntries(entities.map(entity=>[entity,createSchemas[entity].partial()])),
  locations:createSchemas.locations.extend({mapX:coordinate,mapY:coordinate}).partial(),
  rooms:createSchemas.rooms.omit({locationId:true}).extend({geometry:geometrySchema.nullable()}).partial(),
  storages:createSchemas.storages.omit({roomId:true}).extend({parentStorageId:z.string().max(200)}).partial(),
  furniture:furnitureSchema.partial(),
} as Record<Entity,z.AnyZodObject>;

export type Operation = {entity:Entity;action:'create'|'update'|'delete';id?:string;ref?:string;data?:Record<string,any>};
const variants = entities.flatMap(entity=>[
  z.object({entity:z.literal(entity),action:z.literal('create'),ref:z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,49}$/).optional(),data:createSchemas[entity]}).strict(),
  z.object({entity:z.literal(entity),action:z.literal('update'),id,data:updateSchemas[entity].refine(data=>Object.keys(data).length>0,'更新不能为空')}).strict(),
  z.object({entity:z.literal(entity),action:z.literal('delete'),id}).strict(),
]);
export const operationsSchema = z.array(z.union([variants[0],variants[1],...variants.slice(2)])).min(1).max(100);
export const listSchema = z.object({
  entity:entitySchema,query:z.string().max(200).optional(),
  parentId:id.optional(),cursor:z.string().max(500).optional(),limit:z.number().int().min(1).max(100).default(50),
}).strict();
