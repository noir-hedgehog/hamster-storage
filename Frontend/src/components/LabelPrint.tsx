import React, { useState, useMemo } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { Printer, QrCode, X, Download } from 'lucide-react';

interface LabelPrintProps {
  onClose: () => void;
}

export function LabelPrint({ onClose }: LabelPrintProps) {
  const { items, storages, getStoragePath } = useStorage();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');

  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getLabelSize = () => {
    switch (labelSize) {
      case 'small':
        return 'w-32 h-20';
      case 'medium':
        return 'w-48 h-28';
      case 'large':
        return 'w-64 h-36';
    }
  };

  // 生成QR码数据URL（使用简单的SVG QR码）
  const generateQRCode = (text: string): string => {
    // 这里使用一个简单的QR码生成方法
    // 实际项目中可以使用 qrcode 库
    const qrSize = 100;
    const cellSize = 4;
    const size = qrSize / cellSize;
    
    // 简单的示例：生成一个基础的QR码样式
    // 实际应该使用专业的QR码库如 qrcode.react 或 qrcode
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${qrSize}" height="${qrSize}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${qrSize}" height="${qrSize}" fill="white"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="10">QR</text>
      </svg>
    `)}`;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 头部工具栏 */}
      <div className="border-b border-gray-200 p-4 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">打印标签</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">标签尺寸:</label>
            <select
              value={labelSize}
              onChange={e => setLabelSize(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none ring-mint"
            >
              <option value="small">小 (40x25mm)</option>
              <option value="medium">中 (60x35mm)</option>
              <option value="large">大 (80x45mm)</option>
            </select>
          </div>

          <div className="flex-1" />

          <button
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 btn-mint rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            打印标签 ({selectedItems.length})
          </button>
        </div>
      </div>

      {/* 物品选择列表 */}
      <div className="flex-1 overflow-y-auto p-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedItems.includes(item.id)
                  ? 'border-mint-500 bg-mint-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => {}}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{getStoragePath(item.storageId)}</p>
                  {item.rfid && (
                    <p className="text-xs text-gray-400 mt-1">RFID: {item.rfid}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 打印预览区域 */}
      <div className="hidden print:block p-8">
        <div className="grid grid-cols-3 gap-4">
          {selectedItems.map(itemId => {
            const item = items.find(i => i.id === itemId);
            if (!item) return null;

            return (
              <div
                key={item.id}
                className={`${getLabelSize()} border-2 border-black border-dashed p-2 flex flex-col justify-between page-break-inside-avoid`}
              >
                <div>
                  <div className="font-bold text-sm mb-1 truncate">{item.name}</div>
                  <div className="text-xs text-gray-600 truncate">{getStoragePath(item.storageId)}</div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-xs">
                    {item.quantity} {item.unit || '件'}
                  </div>
                  {(item.rfid || item.barcode) && (
                    <div className="flex items-center justify-center w-12 h-12 border border-black bg-white">
                      {item.rfid ? (
                        <div className="text-[6px] text-center p-1 break-all">
                          {item.rfid.substring(0, 8)}
                        </div>
                      ) : (
                        <QrCode className="w-10 h-10" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
