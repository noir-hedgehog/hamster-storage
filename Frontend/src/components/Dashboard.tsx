import React, { useMemo } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { Package, TrendingUp, AlertCircle, Home, DollarSign, Calendar, TrendingDown, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export function Dashboard() {
  const { locations, rooms, storages, items, alerts, categories } = useStorage();

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, item) => {
      const price = item.price || 0;
      return sum + price * item.quantity;
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
    const totalDepreciation = totalValue - currentValue;
    
    // 计算即将过期的物品
    const expiringItems = items.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    });

    // 统计各分类
    const categoryStats = items.reduce((acc, item) => {
      if (item.categoryId) {
        const category = categories.find(c => c.id === item.categoryId);
        const catName = category?.name || '未知分类';
        acc[catName] = (acc[catName] || 0) + item.quantity;
      } else {
        acc['未分类'] = (acc['未分类'] || 0) + item.quantity;
      }
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // 按位置统计
    const locationStats = locations.map(location => {
      const locationRooms = rooms.filter(r => r.locationId === location.id);
      const roomIds = locationRooms.map(r => r.id);
      const locationStorages = storages.filter(s => roomIds.includes(s.roomId));
      const storageIds = locationStorages.map(s => s.id);
      const locationItems = items.filter(item => storageIds.includes(item.storageId));
      const locationValue = locationItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
      
      return {
        name: location.name,
        value: locationValue,
        count: locationItems.length,
      };
    });

    // 过期状态统计
    const expiryStats = {
      expired: items.filter(item => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) < new Date();
      }).length,
      expiring: items.filter(item => {
        if (!item.expiryDate) return false;
        const expiryDate = new Date(item.expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
      }).length,
      normal: items.filter(item => {
        if (!item.expiryDate) return true;
        const expiryDate = new Date(item.expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 7;
      }).length,
    };

    return {
      totalValue,
      currentValue,
      totalDepreciation,
      totalQuantity,
      expiringItems: expiringItems.length,
      topCategories,
      locationStats,
      expiryStats,
    };
  }, [items, locations, rooms, storages]);

  const recentItems = useMemo(() => {
    return [...items]
      .sort((a, b) => {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [items]);

  return (
    <div className="p-6 space-y-6">
      {/* 欢迎区域 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">欢迎回来</h1>
        <p className="text-gray-500 mt-1">你的仓鼠收纳小窝</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card border border-gray-200/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">地点数量</p>
              <p className="text-3xl font-bold text-gray-900">{locations.length}</p>
            </div>
            <div className="p-3 bg-mint-100 rounded-xl">
              <Home className="w-8 h-8 text-mint-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">{rooms.length} 个房间，{storages.length} 个收纳位置</p>
        </div>

        <div className="glass-card border border-gray-200/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">物品种类</p>
              <p className="text-3xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="p-3 bg-mint-100 rounded-xl">
              <Package className="w-8 h-8 text-mint-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">总数量 {stats.totalQuantity} 件</p>
        </div>

        <div className="glass-card border border-gray-200/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">总价值</p>
              <p className="text-3xl font-bold text-gray-900">¥{stats.totalValue.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-mint-100 rounded-xl">
              <DollarSign className="w-8 h-8 text-mint-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">物品总估值</p>
        </div>

        <div className="glass-card border border-gray-200/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">提醒</p>
              <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">{stats.expiringItems} 件即将过期</p>
        </div>
      </div>

      {/* 价值统计卡片 */}
      {stats.totalDepreciation > 0 && (
        <div className="glass-card rounded-xl border border-mint-200 p-6 bg-mint-50/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">总价值（含折旧）</p>
              <p className="text-2xl font-bold text-gray-900">¥{stats.totalValue.toFixed(0)}</p>
              <p className="text-sm text-gray-500 mt-1">当前价值: ¥{stats.currentValue.toFixed(0)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-600 mb-1">已折旧</p>
              <p className="text-xl font-semibold text-red-600">-¥{stats.totalDepreciation.toFixed(0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类统计 - 柱状图 */}
        <div className="glass-card border border-gray-200/60 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            分类分布
          </h3>
          {stats.topCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.topCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">暂无分类数据</p>
          )}
        </div>

        {/* 过期状态统计 - 饼图 */}
        <div className="glass-card border border-gray-200/60 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            过期状态
          </h3>
          {items.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: '正常', value: stats.expiryStats.normal, color: '#10b981' },
                    { name: '即将过期', value: stats.expiryStats.expiring, color: '#f59e0b' },
                    { name: '已过期', value: stats.expiryStats.expired, color: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: '正常', value: stats.expiryStats.normal, color: '#10b981' },
                    { name: '即将过期', value: stats.expiryStats.expiring, color: '#f59e0b' },
                    { name: '已过期', value: stats.expiryStats.expired, color: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">暂无数据</p>
          )}
        </div>

        {/* 位置价值分布 */}
        {stats.locationStats.length > 0 && (
          <div className="glass-card border border-gray-200/60 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              位置价值分布
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.locationStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 最近添加 */}
        <div className="glass-card border border-gray-200/60 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            最近添加
          </h3>
          <div className="space-y-3">
            {recentItems.length > 0 ? (
              recentItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.purchaseDate
                        ? new Date(item.purchaseDate).toLocaleDateString('zh-CN')
                        : '未设置日期'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {item.quantity} {item.unit || '件'}
                    </p>
                    {item.price && (
                      <p className="text-xs text-gray-500">¥{item.price.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">暂无物品</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
