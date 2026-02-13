import React, { useState } from 'react';
import { StorageProvider, useStorage } from './contexts/StorageContext';
import { LocationTree } from './components/LocationTree';
import { ItemList } from './components/ItemList';
import { ItemForm } from './components/ItemForm';
import { AlertPanel } from './components/AlertPanel';
import { LabelPrint } from './components/LabelPrint';
import { RFIDScanner } from './components/RFIDScanner';
import { ScenarioMode } from './components/ScenarioMode';
import { DigitalTwin } from './components/DigitalTwin';
import { Dashboard } from './components/Dashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Item } from './types';
import {
  LayoutDashboard,
  Package,
  Bell,
  Printer,
  Radio,
  Sparkles,
  Layers,
  X,
  Database,
  AlertCircle,
  RefreshCw,
  FolderTree,
  Tag as TagIcon,
  Home,
} from 'lucide-react';
import { DataManager } from './components/DataManager';
import { CategoryManager } from './components/CategoryManager';
import { TagManager } from './components/TagManager';
import { StorageVisualView } from './components/StorageVisualView';

type View = 'dashboard' | 'storage' | 'storage-visual' | 'items' | 'alerts' | 'categories' | 'tags';

function AppContent() {
  const { loading, error, refreshData, addLocation, addRoom, addStorage } = useStorage();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [showLabelPrint, setShowLabelPrint] = useState(false);
  const [showRFIDScanner, setShowRFIDScanner] = useState(false);
  const [showScenarioMode, setShowScenarioMode] = useState(false);
  const [showDigitalTwin, setShowDigitalTwin] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  
  // 添加地点/房间/收纳的模态框状态
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddStorageModal, setShowAddStorageModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newStorageName, setNewStorageName] = useState('');
  const [newStorageDesc, setNewStorageDesc] = useState('');
  const [addStorageContext, setAddStorageContext] = useState<{ roomId: string; locationId?: string; parentStorageId?: string } | null>(null);

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleAddItem = () => {
    setEditingItem(undefined);
    setShowItemForm(true);
  };

  const handleQuickAddItem = () => {
    setEditingItem(undefined);
    setShowItemForm(true);
    // 通过自定义事件传递quickMode标志
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('itemFormQuickMode', { detail: true }));
    }, 100);
  };

  const handleCloseForm = () => {
    setShowItemForm(false);
    setEditingItem(undefined);
  };

  // 监听来自LocationTree的事件
  React.useEffect(() => {
    const handleOpenAddLocation = () => {
      setNewLocationName('');
      setShowAddLocationModal(true);
    };

    const handleOpenAddRoom = (e: any) => {
      const { locationId } = e.detail || {};
      setNewRoomName('');
      setShowAddRoomModal(true);
      setAddStorageContext({ roomId: '', locationId, parentStorageId: undefined });
    };

    const handleOpenAddStorage = (e: any) => {
      const { roomId, parentStorageId } = e.detail || {};
      setNewStorageName('');
      setNewStorageDesc('');
      setAddStorageContext({ roomId, parentStorageId });
      setShowAddStorageModal(true);
    };

    window.addEventListener('openAddLocationModal', handleOpenAddLocation);
    window.addEventListener('openAddRoomModal', handleOpenAddRoom);
    window.addEventListener('openAddStorageModal', handleOpenAddStorage);

    return () => {
      window.removeEventListener('openAddLocationModal', handleOpenAddLocation);
      window.removeEventListener('openAddRoomModal', handleOpenAddRoom);
      window.removeEventListener('openAddStorageModal', handleOpenAddStorage);
    };
  }, []);

  const handleAddLocation = async () => {
    if (newLocationName.trim()) {
      try {
        await addLocation({ name: newLocationName, type: 'location' });
        setNewLocationName('');
        setShowAddLocationModal(false);
      } catch (error) {
        alert('添加地点失败，请重试');
      }
    }
  };

  const handleAddRoom = async () => {
    if (newRoomName.trim() && addStorageContext?.locationId) {
      try {
        await addRoom({ name: newRoomName, type: 'room', locationId: addStorageContext.locationId });
        setNewRoomName('');
        setShowAddRoomModal(false);
        setAddStorageContext(null);
      } catch (error) {
        alert('添加房间失败，请重试');
      }
    }
  };

  const handleAddStorage = async () => {
    if (newStorageName.trim() && addStorageContext) {
      try {
        await addStorage({
          name: newStorageName,
          type: 'storage',
          roomId: addStorageContext.roomId,
          parentStorageId: addStorageContext.parentStorageId,
          description: newStorageDesc,
        });
        setNewStorageName('');
        setNewStorageDesc('');
        setShowAddStorageModal(false);
        setAddStorageContext(null);
      } catch (error) {
        alert('添加收纳位置失败，请重试');
      }
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center page-mint-gradient">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center page-mint-gradient p-4">
        <div className="glass-modal rounded-xl border border-red-200 p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">连接错误</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            请确保后端服务正在运行 (http://localhost:3001)
          </p>
          <button
            onClick={() => refreshData()}
            className="w-full px-4 py-2 btn-mint rounded-lg text-white flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col page-mint-gradient">
        {/* 顶部导航栏 */}
        <header className="glass border-b border-gray-200/60 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">家庭收纳管理系统</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">像维护文件系统一样管理你的家</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => setShowDataManager(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-700 btn-mint-ghost rounded-lg transition-colors"
                title="数据管理"
              >
                <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden lg:inline">数据</span>
              </button>
              <button
                onClick={() => setShowDigitalTwin(true)}
                className="hidden sm:flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="数字孪生"
              >
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden lg:inline">数字孪生</span>
              </button>
              <button
                onClick={() => setShowScenarioMode(true)}
                className="hidden sm:flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="场景模式"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden lg:inline">场景模式</span>
              </button>
              <button
                onClick={() => setShowRFIDScanner(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-700 btn-mint-ghost rounded-lg transition-colors"
                title="RFID扫描"
              >
                <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden lg:inline">RFID</span>
              </button>
              <button
                onClick={() => setShowLabelPrint(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-700 btn-mint-ghost rounded-lg transition-colors"
                title="打印标签"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden lg:inline">打印</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* 主内容区域 */}
          <main className="flex-1 flex flex-col overflow-hidden w-full">
            {/* 视图切换标签 */}
            <div className="glass border-b border-gray-200/60 px-3 sm:px-6 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                    currentView === 'dashboard'
                      ? 'bg-mint-active border-mint-500 text-mint-700'
                      : 'text-gray-500 border-transparent hover:text-gray-700 btn-mint-ghost'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">仪表板</span>
                </button>
                <button
                  onClick={() => setCurrentView('storage')}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                    currentView === 'storage'
                      ? 'bg-mint-active border-mint-500 text-mint-700'
                      : 'text-gray-500 border-transparent hover:text-gray-700 btn-mint-ghost'
                  }`}
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">储物空间</span>
                </button>
                <button
                  onClick={() => setCurrentView('items')}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                    currentView === 'items'
                      ? 'bg-mint-active border-mint-500 text-mint-700'
                      : 'text-gray-500 border-transparent hover:text-gray-700 btn-mint-ghost'
                  }`}
                >
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">物品管理</span>
                </button>
                <button
                  onClick={() => setCurrentView('categories')}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                    currentView === 'categories'
                      ? 'bg-mint-active border-mint-500 text-mint-700'
                      : 'text-gray-500 border-transparent hover:text-gray-700 btn-mint-ghost'
                  }`}
                >
                  <FolderTree className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">分类管理</span>
                </button>
                <button
                  onClick={() => setCurrentView('tags')}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                    currentView === 'tags'
                      ? 'bg-mint-active border-mint-500 text-mint-700'
                      : 'text-gray-500 border-transparent hover:text-gray-700 btn-mint-ghost'
                  }`}
                >
                  <TagIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">标签管理</span>
                </button>
                <button
                  onClick={() => setCurrentView('alerts')}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                    currentView === 'alerts'
                      ? 'bg-mint-active border-mint-500 text-mint-700'
                      : 'text-gray-500 border-transparent hover:text-gray-700 btn-mint-ghost'
                  }`}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">提醒中心</span>
                </button>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-hidden">
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'storage' && (
                <div className="h-full overflow-y-auto">
                  <LocationTree onSwitchToVisual={() => setCurrentView('storage-visual')} />
                </div>
              )}
              {currentView === 'storage-visual' && (
                <div className="h-full overflow-y-auto">
                  <StorageVisualView onClose={() => setCurrentView('storage')} />
                </div>
              )}
              {currentView === 'items' && (
                <ItemList onEditItem={handleEditItem} onAddItem={handleAddItem} />
              )}
              {currentView === 'alerts' && (
                <div className="p-6 overflow-y-auto h-full">
                  <AlertPanel />
                </div>
              )}
              {currentView === 'categories' && (
                <div className="h-full overflow-y-auto">
                  <CategoryManager onClose={() => setCurrentView('dashboard')} />
                </div>
              )}
              {currentView === 'tags' && (
                <div className="h-full overflow-y-auto">
                  <TagManager onClose={() => setCurrentView('dashboard')} />
                </div>
              )}
            </div>
          </main>
        </div>

        {/* 模态框 */}
        {showItemForm && <ItemForm item={editingItem} onClose={handleCloseForm} quickMode={false} />}
        {showLabelPrint && <LabelPrint onClose={() => setShowLabelPrint(false)} />}
        {showRFIDScanner && <RFIDScanner onClose={() => setShowRFIDScanner(false)} />}
        {showScenarioMode && <ScenarioMode onClose={() => setShowScenarioMode(false)} />}
        {showDigitalTwin && <DigitalTwin onClose={() => setShowDigitalTwin(false)} />}
        {showDataManager && <DataManager onClose={() => setShowDataManager(false)} />}

        {/* 添加地点模态框 */}
        {showAddLocationModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-modal rounded-xl p-6 max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">添加新地点</h3>
                <button
                  onClick={() => setShowAddLocationModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={newLocationName}
                onChange={e => setNewLocationName(e.target.value)}
                placeholder="例如：主住所、仓库、办公室"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint mb-4"
                autoFocus
                onKeyPress={e => e.key === 'Enter' && handleAddLocation()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddLocationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddLocation}
                  className="flex-1 px-4 py-2 btn-mint rounded-lg text-white"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加房间模态框 */}
        {showAddRoomModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-modal rounded-xl p-6 max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">添加新房间</h3>
                <button
                  onClick={() => setShowAddRoomModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="例如：卧室、厨房、客厅"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint mb-4"
                autoFocus
                onKeyPress={e => e.key === 'Enter' && handleAddRoom()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddRoomModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddRoom}
                  className="flex-1 px-4 py-2 btn-mint rounded-lg text-white"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加收纳位置模态框 */}
        {showAddStorageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-modal rounded-xl p-6 max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  {addStorageContext?.parentStorageId ? '添加子收纳' : '添加收纳位置'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddStorageModal(false);
                    setAddStorageContext(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={newStorageName}
                onChange={e => setNewStorageName(e.target.value)}
                placeholder={addStorageContext?.parentStorageId ? "例如：上层、下层、左侧" : "例如：衣柜、抽屉、书架"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint mb-3"
                autoFocus
                onKeyPress={e => e.key === 'Enter' && handleAddStorage()}
              />
              <textarea
                value={newStorageDesc}
                onChange={e => setNewStorageDesc(e.target.value)}
                placeholder="描述（可选）"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint resize-none mb-4"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddStorageModal(false);
                    setAddStorageContext(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddStorage}
                  className="flex-1 px-4 py-2 btn-mint rounded-lg text-white"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <StorageProvider>
        <AppContent />
      </StorageProvider>
    </ErrorBoundary>
  );
}

export default App;
