import { Request, Response } from 'express';
import { StorageModel } from '../models/StorageModel';
import { CreateStorageDto, UpdateStorageDto } from '../types';

export class StorageController {
  static async getAll(req: Request, res: Response) {
    try {
      const { roomId, parentStorageId } = req.query;
      
      let storages;
      if (parentStorageId) {
        storages = StorageModel.findByParentStorageId(parentStorageId as string);
      } else if (roomId) {
        storages = StorageModel.findByRoomId(roomId as string);
      } else {
        storages = StorageModel.findAll();
      }
      
      res.json({ success: true, data: storages });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取收纳位置列表失败' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const storage = StorageModel.findById(id);
      
      if (!storage) {
        return res.status(404).json({ success: false, error: '收纳位置不存在' });
      }
      
      res.json({ success: true, data: storage });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取收纳位置失败' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data: CreateStorageDto = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ success: false, error: '收纳位置名称不能为空' });
      }

      if (!data.roomId) {
        return res.status(400).json({ success: false, error: '房间ID不能为空' });
      }

      // 如果指定了父收纳，验证父收纳存在
      if (data.parentStorageId) {
        const parentStorage = StorageModel.findById(data.parentStorageId);
        if (!parentStorage) {
          return res.status(400).json({ success: false, error: '父收纳位置不存在' });
        }
      }

      const storage = StorageModel.create(data);
      res.status(201).json({ success: true, data: storage });
    } catch (error) {
      res.status(500).json({ success: false, error: '创建收纳位置失败' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateStorageDto = req.body;

      const storage = StorageModel.update(id, data);
      
      if (!storage) {
        return res.status(404).json({ success: false, error: '收纳位置不存在' });
      }

      res.json({ success: true, data: storage });
    } catch (error) {
      res.status(500).json({ success: false, error: '更新收纳位置失败' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = StorageModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: '收纳位置不存在' });
      }

      res.json({ success: true, message: '收纳位置已删除' });
    } catch (error) {
      res.status(500).json({ success: false, error: '删除收纳位置失败' });
    }
  }
}
