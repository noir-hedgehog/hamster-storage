import { Request, Response } from 'express';
import { LocationModel } from '../models/LocationModel';
import { RoomModel } from '../models/RoomModel';
import { StorageModel } from '../models/StorageModel';
import { ItemModel } from '../models/ItemModel';
import { CategoryModel } from '../models/CategoryModel';

export class StatsController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const locations = LocationModel.findAll();
      const rooms = RoomModel.findAll();
      const storages = StorageModel.findAll();
      const items = ItemModel.findAll();
      const alerts = ItemModel.getAlerts();

      // 计算总价值
      const totalValue = items.reduce((sum, item) => {
        return sum + (item.price || 0) * item.quantity;
      }, 0);

      // 计算当前价值（考虑折旧）
      const currentValue = items.reduce((sum, item) => {
        if (!item.price || !item.purchaseDate || !item.depreciationRate) {
          return sum + (item.price || 0) * item.quantity;
        }
        const purchaseDate = new Date(item.purchaseDate);
        const now = new Date();
        const yearsPassed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        const depreciationFactor = Math.pow(1 - item.depreciationRate / 100, yearsPassed);
        const currentPrice = Math.max(0, item.price * depreciationFactor);
        return sum + currentPrice * item.quantity;
      }, 0);

      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

      // 分类统计（按分类名称聚合，无 categoryId 或未找到分类的记为「未分类」）
      const categoryList = CategoryModel.findAll();
      const categoryNameById = new Map(categoryList.map(c => [c.id, c.name]));
      const categories = items.reduce((acc, item) => {
        const cat = item.categoryId ? (categoryNameById.get(item.categoryId) || '未分类') : '未分类';
        acc[cat] = (acc[cat] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // 过期状态统计
      const now = new Date();
      const expiryStats = {
        expired: items.filter(item => {
          if (!item.expiryDate) return false;
          return new Date(item.expiryDate) < now;
        }).length,
        expiring: items.filter(item => {
          if (!item.expiryDate) return false;
          const expiryDate = new Date(item.expiryDate);
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
        }).length,
        normal: items.filter(item => {
          if (!item.expiryDate) return true;
          const expiryDate = new Date(item.expiryDate);
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 7;
        }).length,
      };

      res.json({
        success: true,
        data: {
          locations: locations.length,
          rooms: rooms.length,
          storages: storages.length,
          items: items.length,
          totalQuantity,
          totalValue,
          currentValue,
          totalDepreciation: totalValue - currentValue,
          alerts: alerts.length,
          topCategories,
          expiryStats,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取统计数据失败' });
    }
  }
}
