import { Request, Response } from 'express';
import { CategoryModel } from '../models/CategoryModel';
import { CreateCategoryDto, UpdateCategoryDto } from '../types';

export class CategoryController {
  static async getAll(req: Request, res: Response) {
    try {
      const { parentCategoryId } = req.query;
      
      let categories;
      if (parentCategoryId === 'null' || parentCategoryId === null) {
        categories = CategoryModel.findByParentId(null);
      } else if (parentCategoryId) {
        categories = CategoryModel.findByParentId(parentCategoryId as string);
      } else {
        categories = CategoryModel.findAll();
      }
      
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取分类列表失败' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = CategoryModel.findById(id);
      
      if (!category) {
        return res.status(404).json({ success: false, error: '分类不存在' });
      }
      
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取分类失败' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data: CreateCategoryDto = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ success: false, error: '分类名称不能为空' });
      }

      // 如果指定了父分类，验证父分类存在
      if (data.parentCategoryId) {
        const parentCategory = CategoryModel.findById(data.parentCategoryId);
        if (!parentCategory) {
          return res.status(400).json({ success: false, error: '父分类不存在' });
        }
      }

      const category = CategoryModel.create(data);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, error: '创建分类失败' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateCategoryDto = req.body;

      // 如果更新父分类，验证不能将自己设为父分类
      if (data.parentCategoryId === id) {
        return res.status(400).json({ success: false, error: '不能将自己设为父分类' });
      }

      // 如果指定了父分类，验证父分类存在
      if (data.parentCategoryId) {
        const parentCategory = CategoryModel.findById(data.parentCategoryId);
        if (!parentCategory) {
          return res.status(400).json({ success: false, error: '父分类不存在' });
        }
      }

      const category = CategoryModel.update(id, data);
      
      if (!category) {
        return res.status(404).json({ success: false, error: '分类不存在' });
      }

      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, error: '更新分类失败' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = CategoryModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: '分类不存在' });
      }

      res.json({ success: true, message: '分类已删除' });
    } catch (error: any) {
      const message = error.message || '删除分类失败';
      res.status(400).json({ success: false, error: message });
    }
  }
}
