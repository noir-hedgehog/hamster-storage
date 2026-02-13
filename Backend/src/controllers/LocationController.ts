import { Request, Response } from 'express';
import { LocationModel } from '../models/LocationModel';
import { CreateLocationDto, UpdateLocationDto } from '../types';

export class LocationController {
  static async getAll(req: Request, res: Response) {
    try {
      const locations = LocationModel.findAll();
      res.json({ success: true, data: locations });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取地点列表失败' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const location = LocationModel.findById(id);
      
      if (!location) {
        return res.status(404).json({ success: false, error: '地点不存在' });
      }
      
      res.json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取地点失败' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data: CreateLocationDto = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ success: false, error: '地点名称不能为空' });
      }

      const location = LocationModel.create(data);
      res.status(201).json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, error: '创建地点失败' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateLocationDto = req.body;

      const location = LocationModel.update(id, data);
      
      if (!location) {
        return res.status(404).json({ success: false, error: '地点不存在' });
      }

      res.json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, error: '更新地点失败' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = LocationModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: '地点不存在' });
      }

      res.json({ success: true, message: '地点已删除' });
    } catch (error) {
      res.status(500).json({ success: false, error: '删除地点失败' });
    }
  }
}
