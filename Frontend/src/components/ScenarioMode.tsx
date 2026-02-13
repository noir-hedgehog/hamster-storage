import React, { useState } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { X, CheckCircle, Sparkles, ShoppingBag, Home, Luggage, Package } from 'lucide-react';

interface ScenarioModeProps {
  onClose: () => void;
}

const scenarios = [
  {
    id: 'shopping',
    name: '购物入库',
    icon: ShoppingBag,
    description: '整理刚购买的物品并入库',
    steps: [
      '检查购物清单',
      '拆除外包装',
      '扫描或录入商品信息',
      '分配储存位置',
      '更新库存数量',
      '设置过期提醒（如适用）',
    ],
  },
  {
    id: 'moving',
    name: '搬家整理',
    icon: Home,
    description: '系统化整理物品准备搬家',
    steps: [
      '按房间分类物品',
      '为每个箱子生成标签',
      '记录箱子内容清单',
      '标记易碎物品',
      '设置新地址的收纳位置',
      '打印搬运清单',
    ],
  },
  {
    id: 'travel',
    name: '旅行打包',
    icon: Luggage,
    description: '准备旅行物品并记录',
    steps: [
      '创建旅行物品清单',
      '检查物品数量',
      '标记已打包物品',
      '设置临时存放位置',
      '检查证件和贵重物品',
      '生成打包清单',
    ],
  },
  {
    id: 'organize',
    name: '定期整理',
    icon: Package,
    description: '定期检查和整理储物空间',
    steps: [
      '检查过期物品',
      '清理不需要的物品',
      '整理混乱的收纳位置',
      '更新物品数量',
      '优化储存布局',
      '生成整理报告',
    ],
  },
];

export function ScenarioMode({ onClose }: ScenarioModeProps) {
  const { items, alerts } = useStorage();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const currentScenario = scenarios.find(s => s.id === selectedScenario);

  const toggleStep = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter(i => i !== stepIndex));
    } else {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const resetProgress = () => {
    setCompletedSteps([]);
  };

  const getScenarioStats = (scenarioId: string) => {
    switch (scenarioId) {
      case 'shopping':
        return {
          label: '待入库',
          value: items.filter(item => !item.purchaseDate).length,
        };
      case 'organize':
        return {
          label: '需要整理',
          value: alerts.length,
        };
      case 'moving':
        return {
          label: '总物品',
          value: items.length,
        };
      case 'travel':
        return {
          label: '可携带',
          value: Math.floor(items.length * 0.3),
        };
      default:
        return { label: '项目', value: 0 };
    }
  };

  if (currentScenario) {
    const progress = completedSteps.length / currentScenario.steps.length * 100;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="glass-modal rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-mint-100 rounded-xl">
                  <currentScenario.icon className="w-6 h-6 text-mint-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{currentScenario.name}</h2>
                  <p className="text-sm text-gray-500">{currentScenario.description}</p>
                </div>
              </div>
              <button onClick={() => setSelectedScenario(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">进度</span>
                <span className="font-medium text-gray-900">
                  {completedSteps.length} / {currentScenario.steps.length}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-mint-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 步骤列表 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {currentScenario.steps.map((step, index) => {
                const isCompleted = completedSteps.includes(index);

                return (
                  <div
                    key={index}
                    onClick={() => toggleStep(index)}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isCompleted
                        ? 'bg-mint-50 border-mint-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-mint-600" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-500">{index + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isCompleted ? 'text-mint-900 line-through' : 'text-gray-900'}`}>
                        {step}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 底部操作 */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={resetProgress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                重置进度
              </button>
              <button
                onClick={() => {
                  if (progress === 100) {
                    alert('场景完成！');
                    setSelectedScenario(null);
                    setCompletedSteps([]);
                  } else {
                    alert('请完成所有步骤');
                  }
                }}
                className="flex-1 px-4 py-2 btn-mint rounded-lg text-white"
              >
                {progress === 100 ? '完成' : '继续'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-mint-600" />
              场景化收纳模式
            </h2>
            <p className="text-sm text-gray-500 mt-1">选择一个场景开始整理</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 场景列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map(scenario => {
              const Icon = scenario.icon;
              const stats = getScenarioStats(scenario.id);

              return (
                <div
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className="glass-card border-2 border-gray-200/80 rounded-xl p-6 hover:border-mint-500 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 group-hover:bg-mint-100 rounded-xl transition-colors">
                      <Icon className="w-8 h-8 text-gray-600 group-hover:text-mint-600 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">{scenario.name}</h3>
                      <p className="text-sm text-gray-500 mb-3">{scenario.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{scenario.steps.length} 个步骤</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{stats.label}:</span>
                          <span className="text-sm font-semibold text-mint-600">{stats.value}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
