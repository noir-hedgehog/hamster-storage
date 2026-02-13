import React, { useState, useMemo } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { Item } from '../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  AlertCircle,
  Tag,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  BarChart3,
  CheckSquare,
  Square,
  X,
  ChevronDown,
  ChevronRight,
  Home,
  DoorOpen,
  Archive,
  LayoutGrid,
  List,
  LayoutPanelTop,
} from 'lucide-react';

interface ItemListProps {
  onEditItem: (item: Item) => void;
  onAddItem: () => void;
}

export function ItemList({ onEditItem, onAddItem }: ItemListProps) {
  const { items, storages, rooms, locations, selectedNode, setSelectedNode, getStoragePath, deleteItem, updateItem, tags, categories } = useStorage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTagId, setFilterTagId] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [showStorageDropdown, setShowStorageDropdown] = useState(false);
  const [expandedLocationIds, setExpandedLocationIds] = useState<Set<string>>(new Set());
  const [expandedRoomIds, setExpandedRoomIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'thumbnail'>('card');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [batchEditData, setBatchEditData] = useState<{
    storageId?: string;
    categoryId?: string;
    addTags?: string[];
    removeTags?: string[];
  }>({});

  // 获取所有标签（用于过滤）
  const allTags = useMemo(() => {
    const tagIds = new Set<string>();
    items.forEach(item => item.tags.forEach(tagId => tagIds.add(tagId)));
    return Array.from(tagIds)
      .map(tagId => tags.find(t => t.id === tagId))
      .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined);
  }, [items, tags]);

  // 过滤物品
  const filteredItems = useMemo(() => {
    let filtered = items;

    // 根据选中的节点过滤
    if (selectedNode) {
      if (selectedNode.type === 'storage') {
        filtered = filtered.filter(item => item.storageId === selectedNode.id);
      } else if (selectedNode.type === 'room') {
        const roomStorages = storages.filter(s => s.roomId === selectedNode.id);
        const storageIds = roomStorages.map(s => s.id);
        filtered = filtered.filter(item => storageIds.includes(item.storageId));
      } else if (selectedNode.type === 'location') {
        const locationRooms = rooms.filter(r => r.locationId === selectedNode.id);
        const roomIds = locationRooms.map(r => r.id);
        const locationStorages = storages.filter(s => roomIds.includes(s.roomId));
        const storageIds = locationStorages.map(s => s.id);
        filtered = filtered.filter(item => storageIds.includes(item.storageId));
      }
    }

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(
        item => {
          const itemTags = item.tags.map(tagId => tags.find(t => t.id === tagId)?.name || '').filter(Boolean);
          return (
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            itemTags.some(tagName => tagName.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
      );
    }

    // 标签过滤
    if (filterTagId) {
      filtered = filtered.filter(item => item.tags.includes(filterTagId));
    }

    return filtered;
  }, [items, selectedNode, storages, rooms, searchQuery, filterTagId, tags]);

  // 计算当前价值（考虑折旧）
  const getCurrentValue = (item: Item): { current: number | null; original: number | null; depreciation: number } => {
    const original = item.price || null;
    if (!original || !item.purchaseDate || !item.depreciationRate) {
      return { current: original, original, depreciation: 0 };
    }

    const purchaseDate = new Date(item.purchaseDate);
    const now = new Date();
    const daysPassed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    const yearsPassed = daysPassed / 365;
    
    // 使用年折旧率计算
    const depreciationFactor = Math.pow(1 - item.depreciationRate / 100, yearsPassed);
    const current = Math.max(0, original * depreciationFactor); // 价值不能为负
    const depreciation = original - current;
    
    return { current, original, depreciation };
  };

  // 检查是否即将过期或已过期
  const getExpiryStatus = (item: Item): 'expired' | 'expiring' | 'normal' => {
    if (!item.expiryDate) return 'normal';
    const expiryDate = new Date(item.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring';
    return 'normal';
  };

  const getNodeTitle = (): string => {
    if (!selectedNode) return '全部物品';
    
    if (selectedNode.type === 'storage') {
      const storage = storages.find(s => s.id === selectedNode.id);
      return storage?.name || '收纳位置';
    } else if (selectedNode.type === 'room') {
      const room = rooms.find(r => r.id === selectedNode.id);
      return room?.name || '房间';
    } else if (selectedNode.type === 'location') {
      const location = locations.find(l => l.id === selectedNode.id);
      return location?.name || '地点';
    }
    return '全部物品';
  };

  const handleSelectNode = (node: { type: string; id: string } | null) => {
    setSelectedNode(node);
    setShowStorageDropdown(false);
  };

  return (
    <div className="h-full flex flex-col glass">
      {/* 头部 */}
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-row items-center justify-between gap-3 flex-nowrap">
          {/* 左侧：标题 + 数量 */}
          <div className="relative min-w-0 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowStorageDropdown(!showStorageDropdown)}
              className="flex items-center gap-1.5 text-left group"
            >
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 truncate">{getNodeTitle()}</h2>
              <ChevronDown className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${showStorageDropdown ? 'rotate-180' : ''}`} />
            </button>
            <p className="text-sm text-gray-500 mt-1">{filteredItems.length} 件物品</p>
            {/* 收纳位置下拉 */}
            {showStorageDropdown && (
              <>
                <div className="fixed inset-0 z-[98]" onClick={() => setShowStorageDropdown(false)} aria-hidden />
                <div
                  className="absolute left-0 top-full mt-1 min-w-[220px] max-h-[70vh] overflow-y-auto rounded-xl border shadow-lg p-4"
                  style={{ zIndex: 99, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(237, 237, 237, 1)' }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectNode(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${!selectedNode ? 'bg-mint-50 text-mint-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <Package className="w-4 h-4 text-gray-500" />
                    全部物品
                  </button>
                  {locations.map(loc => {
                    const locRooms = rooms.filter(r => r.locationId === loc.id);
                    const isLocExpanded = expandedLocationIds.has(loc.id);
                    const isLocSelected = selectedNode?.type === 'location' && selectedNode?.id === loc.id;
                    return (
                      <div key={loc.id}>
                        <div className="flex items-stretch">
                          <button
                            type="button"
                            onClick={() => setExpandedLocationIds(prev => {
                              const next = new Set(prev);
                              if (next.has(loc.id)) next.delete(loc.id);
                              else next.add(loc.id);
                              return next;
                            })}
                            className="flex items-center justify-center w-7 flex-shrink-0 text-gray-400 hover:text-gray-600"
                            aria-label={isLocExpanded ? '折叠' : '展开'}
                          >
                            {isLocExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectNode({ type: 'location', id: loc.id })}
                            className={`flex-1 flex items-center gap-2 px-2 py-2 text-left text-sm transition-colors min-w-0 ${isLocSelected ? 'bg-mint-50 text-mint-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                          >
                            <Home className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{loc.name}</span>
                          </button>
                        </div>
                        {isLocExpanded && locRooms.map(room => {
                          const roomStorages = storages.filter(s => s.roomId === room.id && !s.parentStorageId);
                          const isRoomExpanded = expandedRoomIds.has(room.id);
                          const isRoomSelected = selectedNode?.type === 'room' && selectedNode?.id === room.id;
                          return (
                            <div key={room.id} className="pl-4">
                              <div className="flex items-stretch">
                                <button
                                  type="button"
                                  onClick={() => setExpandedRoomIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(room.id)) next.delete(room.id);
                                    else next.add(room.id);
                                    return next;
                                  })}
                                  className="flex items-center justify-center w-7 flex-shrink-0 text-gray-400 hover:text-gray-600"
                                  aria-label={isRoomExpanded ? '折叠' : '展开'}
                                >
                                  {isRoomExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectNode({ type: 'room', id: room.id })}
                                  className={`flex-1 flex items-center gap-2 pl-4 pr-3 py-1.5 text-left text-sm transition-colors min-w-0 ${isRoomSelected ? 'bg-mint-50 text-mint-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                  <DoorOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{room.name}</span>
                                </button>
                              </div>
                              {isRoomExpanded && roomStorages.map(storage => {
                                const isStorageSelected = selectedNode?.type === 'storage' && selectedNode?.id === storage.id;
                                return (
                                  <button
                                    key={storage.id}
                                    type="button"
                                    onClick={() => handleSelectNode({ type: 'storage', id: storage.id })}
                                    className={`w-full flex items-center gap-2 pl-12 pr-3 py-1.5 text-left text-sm transition-colors ${isStorageSelected ? 'bg-mint-50 text-mint-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                                  >
                                    <Archive className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{storage.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 右侧靠右：搜索（点击展开）、视图循环、批量/添加 */}
          <div className="flex flex-wrap items-center gap-2 justify-end flex-shrink-0">
            {/* 搜索：点击按钮展开/收起，横向滑动 */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
              <div className="overflow-hidden transition-[width] duration-300 ease-out" style={{ width: searchExpanded ? 208 : 0 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索物品、描述或标签..."
                  className="w-52 min-w-0 pl-3 pr-2 py-2 border-0 focus:outline-none focus:ring-0 text-sm"
                  aria-label="搜索"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchExpanded(prev => !prev)}
                className={`p-2 text-gray-500 hover:text-gray-700 transition-colors ${searchExpanded ? 'text-mint-600' : ''}`}
                title={searchExpanded ? '收起搜索' : '展开搜索'}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            {/* 视图：单按钮循环 卡片→列表→缩略→卡片 */}
            <button
              type="button"
              onClick={() => setViewMode(prev => (prev === 'card' ? 'list' : prev === 'list' ? 'thumbnail' : 'card'))}
              className="flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-gray-50/80 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title={viewMode === 'card' ? '卡片视图（点击切换列表）' : viewMode === 'list' ? '列表视图（点击切换缩略）' : '缩略视图（点击切换卡片）'}
            >
              {viewMode === 'card' && <LayoutGrid className="w-4 h-4" />}
              {viewMode === 'list' && <List className="w-4 h-4" />}
              {viewMode === 'thumbnail' && <LayoutPanelTop className="w-4 h-4" />}
            </button>
            {isBatchMode && selectedItems.size > 0 && (
              <>
                <button
                  onClick={() => setShowBatchEdit(true)}
                  className="flex items-center gap-2 px-3 py-2 btn-mint rounded-lg text-white text-sm flex-shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                  批量编辑 ({selectedItems.size})
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`确定要删除选中的 ${selectedItems.size} 件物品吗？`)) {
                      try {
                        const ids = Array.from(selectedItems);
                        for (const id of ids) {
                          await deleteItem(id);
                        }
                        setSelectedItems(new Set());
                        setIsBatchMode(false);
                      } catch (error) {
                        alert('批量删除失败，请重试');
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  删除选中 ({selectedItems.size})
                </button>
                <button
                  onClick={() => {
                    setSelectedItems(new Set());
                    setIsBatchMode(false);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex-shrink-0"
                >
                  取消
                </button>
              </>
            )}
            {!isBatchMode && (
              <>
                <button
                  onClick={() => setIsBatchMode(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex-shrink-0"
                >
                  <CheckSquare className="w-4 h-4" />
                  批量操作
                </button>
                <button
                  onClick={onAddItem}
                  className="flex items-center gap-2 px-4 py-2 btn-mint rounded-lg text-white text-sm font-medium flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  添加物品
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 物品列表 */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-1">还没有物品</p>
            <p className="text-sm">点击右上角添加物品按钮开始录入</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col border border-gray-200/80 rounded-xl overflow-hidden bg-white/80">
            {filteredItems.map(item => {
              const valueInfo = getCurrentValue(item);
              const isSelected = selectedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`group flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/80 ${isSelected ? 'bg-mint-50' : ''}`}
                  onClick={() => {
                    if (isBatchMode) {
                      const newSelected = new Set(selectedItems);
                      if (isSelected) newSelected.delete(item.id);
                      else newSelected.add(item.id);
                      setSelectedItems(newSelected);
                    } else {
                      onEditItem(item);
                    }
                  }}
                >
                  {isBatchMode && (
                    <div className="flex-shrink-0">
                      {isSelected ? <CheckSquare className="w-5 h-5 text-mint-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                    </div>
                  )}
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{item.name}</div>
                    {item.description && <div className="text-sm text-gray-500 truncate">{item.description}</div>}
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0 max-w-[140px]">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{getStoragePath(item.storageId)}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex-shrink-0 hidden md:block">{item.quantity} {item.unit || '件'}</div>
                  {valueInfo.original != null && (
                    <div className="text-sm font-medium text-gray-900 flex-shrink-0 hidden lg:block">¥{((valueInfo.original || 0) * item.quantity).toFixed(2)}</div>
                  )}
                  {!isBatchMode && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('确定要删除这个物品吗？')) {
                          try {
                            await deleteItem(item.id);
                          } catch {
                            alert('删除失败，请重试');
                          }
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 rounded text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : viewMode === 'thumbnail' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredItems.map(item => {
              const isSelected = selectedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`relative rounded-xl border-2 overflow-hidden group cursor-pointer ${isSelected ? 'border-mint-500 bg-mint-50' : 'border-gray-200/80 hover:border-gray-300'}`}
                  onClick={() => {
                    if (isBatchMode) {
                      const next = new Set(selectedItems);
                      if (isSelected) next.delete(item.id);
                      else next.add(item.id);
                      setSelectedItems(next);
                    } else {
                      onEditItem(item);
                    }
                  }}
                >
                  {isBatchMode && (
                    <div className="absolute top-1.5 left-1.5 z-10">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-mint-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                    </div>
                  )}
                  <div className="aspect-square bg-gray-100">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="font-medium text-gray-900 text-sm truncate">{item.name}</div>
                    {item.description && <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</div>}
                  </div>
                  {!isBatchMode && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('确定要删除这个物品吗？')) {
                          try {
                            await deleteItem(item.id);
                          } catch {
                            alert('删除失败，请重试');
                          }
                        }
                      }}
                      className="absolute top-1 right-1 p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const expiryStatus = getExpiryStatus(item);
              const valueInfo = getCurrentValue(item);
              const hasAlerts = expiryStatus !== 'normal' || 
                (item.minThreshold !== undefined && item.quantity <= item.minThreshold) ||
                (item.maxThreshold !== undefined && item.quantity >= item.maxThreshold);

              const isSelected = selectedItems.has(item.id);
              
              return (
                <div
                  key={item.id}
                  className={`relative glass-card border-2 rounded-xl p-4 group ${
                    isSelected ? 'border-mint-500 bg-mint-50' : 'border-gray-200/80 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (isBatchMode) {
                      const newSelected = new Set(selectedItems);
                      if (isSelected) {
                        newSelected.delete(item.id);
                      } else {
                        newSelected.add(item.id);
                      }
                      setSelectedItems(newSelected);
                    } else {
                      onEditItem(item);
                    }
                  }}
                >
                  {/* 批量选择复选框 */}
                  {isBatchMode && (
                    <div className="absolute top-2 left-2 z-10">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-mint-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  )}
                  
                  {/* 物品图片 */}
                  {item.images && item.images.length > 0 && (
                    <div className="mb-3">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  {/* 顶部：名称和操作 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    {hasAlerts && (
                      <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  
                  {/* 颜色指示 */}
                  {item.color && (
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-gray-500">颜色</span>
                    </div>
                  )}

                  {/* 位置 */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{getStoragePath(item.storageId)}</span>
                  </div>

                  {/* 数量 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">数量</span>
                    <span className="font-medium text-gray-900">
                      {item.quantity} {item.unit || '件'}
                    </span>
                  </div>

                  {/* 价格和折旧 */}
                  {valueInfo.original !== null && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">价值</span>
                      <div className="text-right">
                        {valueInfo.current !== null && valueInfo.current !== valueInfo.original ? (
                          <>
                            <div className="font-medium text-gray-900">¥{(valueInfo.current * item.quantity).toFixed(2)}</div>
                            <div className="text-xs text-gray-400 line-through">¥{((valueInfo.original || 0) * item.quantity).toFixed(2)}</div>
                            <div className="text-xs text-red-500">已折旧 ¥{valueInfo.depreciation.toFixed(2)}</div>
                          </>
                        ) : (
                          <div className="font-medium text-gray-900">¥{((valueInfo.original || 0) * item.quantity).toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 过期时间 */}
                  {item.expiryDate && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">过期时间</span>
                      <span
                        className={`text-sm font-medium ${
                          expiryStatus === 'expired'
                            ? 'text-red-600'
                            : expiryStatus === 'expiring'
                            ? 'text-orange-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {new Date(item.expiryDate).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  )}

                  {/* 标签 */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.slice(0, 3).map(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <span
                            key={tagId}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag.name}
                          </span>
                        );
                      })}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 删除按钮 */}
                  {!isBatchMode && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('确定要删除这个物品吗？')) {
                          try {
                            await deleteItem(item.id);
                          } catch (error) {
                            alert('删除失败，请重试');
                          }
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 批量编辑弹窗 */}
      {showBatchEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">批量编辑 ({selectedItems.size} 件物品)</h3>
              <button
                onClick={() => {
                  setShowBatchEdit(false);
                  setBatchEditData({});
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 修改收纳位置 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">修改收纳位置</label>
                <select
                  value={batchEditData.storageId || ''}
                  onChange={e => setBatchEditData({ ...batchEditData, storageId: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                >
                  <option value="">不修改</option>
                  {storages.map(storage => (
                    <option key={storage.id} value={storage.id}>
                      {getStoragePath(storage.id)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 修改分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">修改分类</label>
                <select
                  value={batchEditData.categoryId || ''}
                  onChange={e => setBatchEditData({ ...batchEditData, categoryId: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                >
                  <option value="">不修改</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 添加标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">添加标签</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const isSelected = batchEditData.addTags?.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const currentTags = batchEditData.addTags || [];
                          if (isSelected) {
                            setBatchEditData({
                              ...batchEditData,
                              addTags: currentTags.filter(id => id !== tag.id),
                            });
                          } else {
                            setBatchEditData({
                              ...batchEditData,
                              addTags: [...currentTags, tag.id],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'bg-mint-500 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        + {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 移除标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">移除标签</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const isSelected = batchEditData.removeTags?.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const currentTags = batchEditData.removeTags || [];
                          if (isSelected) {
                            setBatchEditData({
                              ...batchEditData,
                              removeTags: currentTags.filter(id => id !== tag.id),
                            });
                          } else {
                            setBatchEditData({
                              ...batchEditData,
                              removeTags: [...currentTags, tag.id],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        - {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowBatchEdit(false);
                  setBatchEditData({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  try {
                    const ids = Array.from(selectedItems);
                    for (const id of ids) {
                      const item = items.find(i => i.id === id);
                      if (!item) continue;

                      const updates: Partial<Item> = {};
                      if (batchEditData.storageId) {
                        updates.storageId = batchEditData.storageId;
                      }
                      if (batchEditData.categoryId !== undefined) {
                        updates.categoryId = batchEditData.categoryId || undefined;
                      }
                      if (batchEditData.addTags && batchEditData.addTags.length > 0) {
                        updates.tags = [...(item.tags || []), ...batchEditData.addTags.filter(tagId => !item.tags.includes(tagId))];
                      }
                      if (batchEditData.removeTags && batchEditData.removeTags.length > 0) {
                        updates.tags = (item.tags || []).filter(tagId => !batchEditData.removeTags!.includes(tagId));
                      }

                      if (Object.keys(updates).length > 0) {
                        await updateItem(id, updates);
                      }
                    }
                    setShowBatchEdit(false);
                    setBatchEditData({});
                    setSelectedItems(new Set());
                    setIsBatchMode(false);
                    alert(`已批量更新 ${ids.length} 件物品`);
                  } catch (error) {
                    alert('批量更新失败，请重试');
                    console.error('Batch update failed:', error);
                  }
                }}
                className="flex-1 px-4 py-2 btn-mint rounded-lg text-white"
              >
                应用更改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
