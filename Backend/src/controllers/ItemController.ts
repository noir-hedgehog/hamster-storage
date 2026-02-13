import { Request, Response } from 'express';
import { ItemModel } from '../models/ItemModel';
import { CreateItemDto, UpdateItemDto } from '../types';

export class ItemController {
  static async getAll(req: Request, res: Response) {
    try {
      const { storageId, search, categoryId, tagId } = req.query;
      
      let items;
      if (storageId) {
        items = ItemModel.findByStorageId(storageId as string);
      } else if (search) {
        items = ItemModel.search(search as string);
      } else {
        items = ItemModel.findAll();
      }

      // 按分类过滤
      if (categoryId) {
        items = items.filter(item => item.categoryId === categoryId);
      }

      // 按标签过滤
      if (tagId) {
        items = items.filter(item => item.tags.includes(tagId as string));
      }
      
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取物品列表失败' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = ItemModel.findById(id);
      
      if (!item) {
        return res.status(404).json({ success: false, error: '物品不存在' });
      }
      
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取物品失败' });
    }
  }

  static async getByRfid(req: Request, res: Response) {
    try {
      const { rfid } = req.params;
      const item = ItemModel.findByRfid(rfid);
      
      if (!item) {
        return res.status(404).json({ success: false, error: '未找到对应的物品' });
      }
      
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取物品失败' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data: CreateItemDto = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ success: false, error: '物品名称不能为空' });
      }

      if (!data.storageId) {
        return res.status(400).json({ success: false, error: '收纳位置ID不能为空' });
      }

      const item = ItemModel.create(data);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: '创建物品失败' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateItemDto = req.body;

      const item = ItemModel.update(id, data);
      
      if (!item) {
        return res.status(404).json({ success: false, error: '物品不存在' });
      }

      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: '更新物品失败' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = ItemModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: '物品不存在' });
      }

      res.json({ success: true, message: '物品已删除' });
    } catch (error) {
      res.status(500).json({ success: false, error: '删除物品失败' });
    }
  }

  static async deleteMany(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: '请提供要删除的物品ID数组' });
      }

      const deletedCount = ItemModel.deleteMany(ids);
      res.json({ success: true, message: `已删除 ${deletedCount} 件物品` });
    } catch (error) {
      res.status(500).json({ success: false, error: '批量删除失败' });
    }
  }
}
