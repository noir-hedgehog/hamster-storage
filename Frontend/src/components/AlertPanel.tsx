import React from 'react';
import { useStorage } from '../contexts/StorageContext';
import { AlertCircle, AlertTriangle, Info, X, Package } from 'lucide-react';

export function AlertPanel() {
  const { alerts, items, getStoragePath } = useStorage();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'low':
        return <Info className="w-5 h-5 text-mint-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-orange-50 border-orange-200';
      case 'low':
        return 'bg-mint-50 border-mint-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'expired':
        return '已过期';
      case 'expiring':
        return '即将过期';
      case 'low-stock':
        return '库存不足';
      case 'overstock':
        return '库存过多';
      default:
        return '提醒';
    }
  };

  // 按严重程度排序
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
  });

  if (alerts.length === 0) {
    return (
      <div className="glass-card border border-gray-200/60 p-6">
        <div className="text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无提醒</p>
          <p className="text-xs mt-1">所有物品状态正常</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card border border-gray-200/60">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          提醒中心
          <span className="ml-auto text-sm font-normal text-gray-500">{alerts.length} 条提醒</span>
        </h3>
      </div>

      <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
        {sortedAlerts.map(alert => {
          const item = items.find(i => i.id === alert.itemId);
          if (!item) return null;

          return (
            <div key={alert.id} className={`p-4 border-l-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {getTypeLabel(alert.type)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 truncate">{item.name}</span>
                  </div>
                  <p className="text-sm text-gray-900 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate">{getStoragePath(item.storageId)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
