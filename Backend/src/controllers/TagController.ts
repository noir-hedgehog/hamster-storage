import { Request, Response } from 'express';
import { TagModel } from '../models/TagModel';
import { CreateTagDto, UpdateTagDto } from '../types';

export class TagController {
  static async getAll(req: Request, res: Response) {
    try {
      const { tagGroupId } = req.query;
      
      let tags;
      if (tagGroupId === 'null' || tagGroupId === null) {
        tags = TagModel.findWithoutGroup();
      } else if (tagGroupId) {
        tags = TagModel.findByGroupId(tagGroupId as string);
      } else {
        tags = TagModel.findAll();
      }
      
      res.json({ success: true, data: tags });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取标签列表失败' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tag = TagModel.findById(id);
      
      if (!tag) {
        return res.status(404).json({ success: false, error: '标签不存在' });
      }
      
      res.json({ success: true, data: tag });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取标签失败' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data: CreateTagDto = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ success: false, error: '标签名称不能为空' });
      }

      // 如果指定了标签分组，验证分组存在
      if (data.tagGroupId) {
        const { TagGroupModel } = await import('../models/TagGroupModel');
        const tagGroup = TagGroupModel.findById(data.tagGroupId);
        if (!tagGroup) {
          return res.status(400).json({ success: false, error: '标签分组不存在' });
        }
      }

      const tag = TagModel.create(data);
      res.status(201).json({ success: true, data: tag });
    } catch (error) {
      res.status(500).json({ success: false, error: '创建标签失败' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateTagDto = req.body;

      // 如果指定了标签分组，验证分组存在
      if (data.tagGroupId) {
        const { TagGroupModel } = await import('../models/TagGroupModel');
        const tagGroup = TagGroupModel.findById(data.tagGroupId);
        if (!tagGroup) {
          return res.status(400).json({ success: false, error: '标签分组不存在' });
        }
      }

      const tag = TagModel.update(id, data);
      
      if (!tag) {
        return res.status(404).json({ success: false, error: '标签不存在' });
      }

      res.json({ success: true, data: tag });
    } catch (error) {
      res.status(500).json({ success: false, error: '更新标签失败' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = TagModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: '标签不存在' });
      }

      res.json({ success: true, message: '标签已删除' });
    } catch (error: any) {
      const message = error.message || '删除标签失败';
      res.status(400).json({ success: false, error: message });
    }
  }
}
