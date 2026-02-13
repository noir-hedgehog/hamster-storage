import React, { useState } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { Download, Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface DataManagerProps {
  onClose: () => void;
}

export function DataManager({ onClose }: DataManagerProps) {
  const { locations, rooms, storages, items, addLocation, addRoom, addStorage, addItem } = useStorage();
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleExport = () => {
    const data = {
      locations,
      rooms,
      storages,
      items,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `收纳数据_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // 验证数据格式
        if (!data.locations || !data.rooms || !data.storages || !data.items) {
          throw new Error('数据格式不正确');
        }

        // 导入数据（这里简化处理，实际应该清空后导入）
        data.locations.forEach((loc: any) => {
          try {
            addLocation(loc);
          } catch (err) {
            console.warn('导入地点失败:', loc);
          }
        });

        data.rooms.forEach((room: any) => {
          try {
            addRoom(room);
          } catch (err) {
            console.warn('导入房间失败:', room);
          }
        });

        data.storages.forEach((storage: any) => {
          try {
            addStorage(storage);
          } catch (err) {
            console.warn('导入收纳位置失败:', storage);
          }
        });

        data.items.forEach((item: any) => {
          try {
            addItem(item);
          } catch (err) {
            console.warn('导入物品失败:', item);
          }
        });

        setImportStatus({ type: 'success', message: '数据导入成功！' });
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 2000);
      } catch (error) {
        setImportStatus({ type: 'error', message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}` });
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    // 导出为CSV格式
    const headers = ['ID', '名称', '描述', '位置', '分类', '品牌', '数量', '单位', '价格', '购买日期', '过期日期', 'RFID', '标签'];
    const rows = items.map(item => {
      const path = locations.find(l => 
        rooms.find(r => r.locationId === l.id && 
          storages.find(s => s.roomId === r.id && s.id === item.storageId)
        )
      )?.name || '';
      
      return [
        item.id,
        item.name,
        item.description || '',
        path,
        item.category || '',
        item.brand || '',
        item.quantity,
        item.unit || '件',
        item.price || 0,
        item.purchaseDate || '',
        item.expiryDate || '',
        item.rfid || '',
        item.tags.join(';'),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `物品清单_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              数据管理
            </h2>
            <p className="text-sm text-gray-500 mt-1">导入或导出你的收纳数据</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 状态提示 */}
        {importStatus && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            importStatus.type === 'success' ? 'bg-mint-50 border border-mint-200' : 'bg-red-50 border border-red-200'
          }`}>
            {importStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-mint-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={importStatus.type === 'success' ? 'text-mint-900' : 'text-red-900'}>
              {importStatus.message}
            </span>
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 导出功能 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Download className="w-5 h-5" />
              导出数据
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExport}
                className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-mint-500 hover:bg-mint-50 transition-all"
              >
                <div className="p-3 bg-mint-100 rounded-xl">
                  <FileText className="w-8 h-8 text-mint-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">导出 JSON</p>
                  <p className="text-xs text-gray-500 mt-1">完整数据备份</p>
                </div>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-mint-500 hover:bg-mint-50 transition-all"
              >
                <div className="p-3 bg-mint-100 rounded-xl">
                  <FileText className="w-8 h-8 text-mint-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">导出 CSV</p>
                  <p className="text-xs text-gray-500 mt-1">Excel 兼容格式</p>
                </div>
              </button>
            </div>
          </div>

          {/* 导入功能 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              导入数据
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-4">选择 JSON 文件导入数据</p>
              <div className="flex justify-center">
                <label className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 btn-mint rounded-lg text-white cursor-pointer whitespace-nowrap">
                  <Upload className="w-4 h-4 flex-shrink-0" />
                  <span>选择文件</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-3">注意：导入会添加新数据，不会覆盖现有数据</p>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 mb-3">当前数据统计</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-mint-600">{locations.length}</p>
                <p className="text-xs text-gray-500 mt-1">地点</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-mint-600">{rooms.length}</p>
                <p className="text-xs text-gray-500 mt-1">房间</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{storages.length}</p>
                <p className="text-xs text-gray-500 mt-1">收纳位</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{items.length}</p>
                <p className="text-xs text-gray-500 mt-1">物品</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
