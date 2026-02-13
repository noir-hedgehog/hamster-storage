import React, { useState } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { Scan, X, CheckCircle, AlertCircle, Radio } from 'lucide-react';

interface RFIDScannerProps {
  onClose: () => void;
}

export function RFIDScanner({ onClose }: RFIDScannerProps) {
  const { items, updateItem } = useStorage();
  const [rfidInput, setRfidInput] = useState('');
  const [scanResults, setScanResults] = useState<Array<{ itemId: string; itemName: string; status: 'success' | 'error'; message: string }>>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    if (!rfidInput.trim()) return;

    setIsScanning(true);
    
    // 模拟扫描延迟
    setTimeout(() => {
      const existingItem = items.find(item => item.rfid === rfidInput);
      
      if (existingItem) {
        setScanResults([
          ...scanResults,
          {
            itemId: existingItem.id,
            itemName: existingItem.name,
            status: 'success',
            message: `已识别物品: ${existingItem.name}`,
          },
        ]);
      } else {
        setScanResults([
          ...scanResults,
          {
            itemId: '',
            itemName: rfidInput,
            status: 'error',
            message: `未找到 RFID: ${rfidInput} 对应的物品`,
          },
        ]);
      }
      
      setRfidInput('');
      setIsScanning(false);
    }, 500);
  };

  const handleBatchAssign = () => {
    // 为没有RFID的物品自动生成RFID
    const itemsWithoutRFID = items.filter(item => !item.rfid);
    let count = 0;
    
    itemsWithoutRFID.forEach(item => {
      const newRFID = `RFID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      updateItem(item.id, { rfid: newRFID });
      count++;
      
      setScanResults(prev => [
        ...prev,
        {
          itemId: item.id,
          itemName: item.name,
          status: 'success',
          message: `已为 ${item.name} 分配 RFID: ${newRFID}`,
        },
      ]);
    });
    
    alert(`已为 ${count} 件物品分配 RFID`);
  };

  const clearResults = () => {
    setScanResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Radio className="w-6 h-6" />
              RFID 扫描器
            </h2>
            <p className="text-sm text-gray-500 mt-1">扫描或录入 RFID 标签</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 扫描区域 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={rfidInput}
                onChange={e => setRfidInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleScan()}
                placeholder="输入或扫描 RFID 标签..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                autoFocus
                disabled={isScanning}
              />
            </div>
            <button
              onClick={handleScan}
              disabled={!rfidInput.trim() || isScanning}
              className="px-6 py-3 btn-mint rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? '扫描中...' : '扫描'}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleBatchAssign}
              className="text-sm text-mint-600 hover:text-mint-700 font-medium"
            >
              批量生成 RFID
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={clearResults}
              disabled={scanResults.length === 0}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium disabled:opacity-50"
            >
              清空记录
            </button>
          </div>
        </div>

        {/* 扫描结果 */}
        <div className="flex-1 overflow-y-auto p-6">
          {scanResults.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Radio className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="text-lg mb-1">准备就绪</p>
              <p className="text-sm">扫描 RFID 标签开始识别物品</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scanResults.slice().reverse().map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
                    result.status === 'success'
                      ? 'bg-mint-50 border-mint-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-mint-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${result.status === 'success' ? 'text-mint-900' : 'text-red-900'}`}>
                      {result.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date().toLocaleTimeString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{items.length}</p>
              <p className="text-sm text-gray-500">总物品数</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-mint-600">
                {items.filter(item => item.rfid).length}
              </p>
              <p className="text-sm text-gray-500">已绑定 RFID</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-orange-600">
                {items.filter(item => !item.rfid).length}
              </p>
              <p className="text-sm text-gray-500">未绑定 RFID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
