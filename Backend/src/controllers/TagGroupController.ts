import { Request, Response } from 'express';
import { TagGroupModel } from '../models/TagGroupModel';
import { CreateTagGroupDto, UpdateTagGroupDto } from '../types';

export class TagGroupController {
  static async getAll(req: Request, res: Response) {
    try {
      const tagGroups = TagGroupModel.findAll();
      res.json({ success: true, data: tagGroups });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取标签分组列表失败' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tagGroup = TagGroupModel.findById(id);
      
      if (!tagGroup) {
        return res.status(404).json({ success: false, error: '标签分组不存在' });
      }
      
      res.json({ success: true, data: tagGroup });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取标签分组失败' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data: CreateTagGroupDto = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ success: false, error: '标签分组名称不能为空' });
      }

      const tagGroup = TagGroupModel.create(data);
      res.status(201).json({ success: true, data: tagGroup });
    } catch (error) {
      res.status(500).json({ success: false, error: '创建标签分组失败' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateTagGroupDto = req.body;

      const tagGroup = TagGroupModel.update(id, data);
      
      if (!tagGroup) {
        return res.status(404).json({ success: false, error: '标签分组不存在' });
      }

      res.json({ success: true, data: tagGroup });
    } catch (error) {
      res.status(500).json({ success: false, error: '更新标签分组失败' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = TagGroupModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: '标签分组不存在' });
      }

      res.json({ success: true, message: '标签分组已删除' });
    } catch (error: any) {
      const message = error.message || '删除标签分组失败';
      res.status(400).json({ success: false, error: message });
    }
  }
}
