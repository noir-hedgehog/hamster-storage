import React, { useState } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { TagGroup, Tag } from '../types';
import { X, Plus, Edit2, Trash2, Tag as TagIcon, Folder } from 'lucide-react';

interface TagManagerProps {
  onClose: () => void;
}

export function TagManager({ onClose }: TagManagerProps) {
  const { tagGroups, tags, addTagGroup, updateTagGroup, deleteTagGroup, addTag, updateTag, deleteTag } = useStorage();
  const [activeTab, setActiveTab] = useState<'groups' | 'tags'>('groups');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TagGroup | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [groupFormData, setGroupFormData] = useState({ name: '', color: '', icon: '', description: '' });
  const [tagFormData, setTagFormData] = useState({ name: '', tagGroupId: '', color: '', icon: '' });

  const handleAddGroup = () => {
    setGroupFormData({ name: '', color: '', icon: '', description: '' });
    setEditingGroup(null);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: TagGroup) => {
    setGroupFormData({
      name: group.name,
      color: group.color || '',
      icon: group.icon || '',
      description: group.description || '',
    });
    setEditingGroup(group);
    setShowGroupModal(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('确定要删除这个标签分组吗？删除后该分组下的标签将变为未分组状态。')) {
      try {
        await deleteTagGroup(id);
      } catch (error: any) {
        alert(error.message || '删除失败，请重试');
      }
    }
  };

  const handleSubmitGroup = async () => {
    if (!groupFormData.name.trim()) {
      alert('请输入分组名称');
      return;
    }

    try {
      if (editingGroup) {
        await updateTagGroup(editingGroup.id, {
          name: groupFormData.name,
          color: groupFormData.color || undefined,
          icon: groupFormData.icon || undefined,
          description: groupFormData.description || undefined,
        });
      } else {
        await addTagGroup({
          name: groupFormData.name,
          color: groupFormData.color || undefined,
          icon: groupFormData.icon || undefined,
          description: groupFormData.description || undefined,
        });
      }
      setShowGroupModal(false);
      setEditingGroup(null);
      setGroupFormData({ name: '', color: '', icon: '', description: '' });
    } catch (error) {
      alert('操作失败，请重试');
    }
  };

  const handleAddTag = () => {
    setTagFormData({ name: '', tagGroupId: '', color: '', icon: '' });
    setEditingTag(null);
    setShowTagModal(true);
  };

  const handleEditTag = (tag: Tag) => {
    setTagFormData({
      name: tag.name,
      tagGroupId: tag.tagGroupId || '',
      color: tag.color || '',
      icon: tag.icon || '',
    });
    setEditingTag(tag);
    setShowTagModal(true);
  };

  const handleDeleteTag = async (id: string) => {
    if (confirm('确定要删除这个标签吗？')) {
      try {
        await deleteTag(id);
      } catch (error: any) {
        alert(error.message || '删除失败，请重试');
      }
    }
  };

  const handleSubmitTag = async () => {
    if (!tagFormData.name.trim()) {
      alert('请输入标签名称');
      return;
    }

    try {
      if (editingTag) {
        await updateTag(editingTag.id, {
          name: tagFormData.name,
          tagGroupId: tagFormData.tagGroupId || undefined,
          color: tagFormData.color || undefined,
          icon: tagFormData.icon || undefined,
        });
      } else {
        await addTag({
          name: tagFormData.name,
          tagGroupId: tagFormData.tagGroupId || undefined,
          color: tagFormData.color || undefined,
          icon: tagFormData.icon || undefined,
        });
      }
      setShowTagModal(false);
      setEditingTag(null);
      setTagFormData({ name: '', tagGroupId: '', color: '', icon: '' });
    } catch (error) {
      alert('操作失败，请重试');
    }
  };

  const getTagsByGroup = (groupId: string) => {
    return tags.filter(t => t.tagGroupId === groupId);
  };

  const getTagsWithoutGroup = () => {
    return tags.filter(t => !t.tagGroupId);
  };

  return (
    <>
      <div className="h-full flex flex-col glass">
        {/* 头部 */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">标签管理</h2>
          </div>
        </div>

        {/* 标签页 */}
        <div className="border-b border-gray-200 px-4 sm:px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'groups'
                  ? 'text-mint-600 border-mint-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              标签分组
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'tags'
                  ? 'text-mint-600 border-mint-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              标签
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === 'groups' ? (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleAddGroup}
                    className="px-4 py-2 btn-mint rounded-lg text-white flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    添加分组
                  </button>
                </div>
                {tagGroups.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>还没有标签分组</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tagGroups.map(group => {
                      const groupTags = getTagsByGroup(group.id);
                      return (
                        <div
                          key={group.id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {group.color && (
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: group.color }}
                                />
                              )}
                              <span className="font-medium">{group.name}</span>
                              <span className="text-sm text-gray-500">
                                ({groupTags.length} 个标签)
                              </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditGroup(group)}
                                className="p-1.5 hover:bg-gray-200 rounded"
                                title="编辑"
                              >
                                <Edit2 className="w-4 h-4 text-mint-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-1.5 hover:bg-gray-200 rounded"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                          {group.description && (
                            <p className="text-sm text-gray-500 mt-2">{group.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 btn-mint rounded-lg text-white flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    添加标签
                  </button>
                </div>
                <div className="space-y-4">
                  {/* 按分组显示标签 */}
                  {tagGroups.map(group => {
                    const groupTags = getTagsByGroup(group.id);
                    if (groupTags.length === 0) return null;
                    return (
                      <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {group.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                          )}
                          <h3 className="font-medium text-gray-700">{group.name}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupTags.map(tag => (
                            <div
                              key={tag.id}
                              className="px-3 py-1.5 bg-mint-50 border border-mint-200 rounded-lg flex items-center gap-2 group/tag"
                            >
                              <TagIcon className="w-3.5 h-3.5 text-mint-600" />
                              <span className="text-sm text-mint-700">{tag.name}</span>
                              <button
                                onClick={() => handleEditTag(tag)}
                                className="opacity-0 group-hover/tag:opacity-100 transition-opacity"
                                title="编辑"
                              >
                                <Edit2 className="w-3 h-3 text-mint-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteTag(tag.id)}
                                className="opacity-0 group-hover/tag:opacity-100 transition-opacity"
                                title="删除"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* 未分组的标签 */}
                  {getTagsWithoutGroup().length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-3">未分组</h3>
                      <div className="flex flex-wrap gap-2">
                        {getTagsWithoutGroup().map(tag => (
                          <div
                            key={tag.id}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 group/tag"
                          >
                            <TagIcon className="w-3.5 h-3.5 text-gray-600" />
                            <span className="text-sm text-gray-700">{tag.name}</span>
                            <button
                              onClick={() => handleEditTag(tag)}
                              className="opacity-0 group-hover/tag:opacity-100 transition-opacity"
                              title="编辑"
                            >
                              <Edit2 className="w-3 h-3 text-mint-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              className="opacity-0 group-hover/tag:opacity-100 transition-opacity"
                              title="删除"
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {tags.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <TagIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>还没有标签</p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* 标签分组模态框 */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {editingGroup ? '编辑标签分组' : '添加标签分组'}
              </h3>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setEditingGroup(null);
                  setGroupFormData({ name: '', color: '', icon: '', description: '' });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分组名称 *
                </label>
                <input
                  type="text"
                  value={groupFormData.name}
                  onChange={e => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  placeholder="例如：颜色、材质、用途"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  颜色（可选）
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={groupFormData.color || '#3B82F6'}
                    onChange={e => setGroupFormData({ ...groupFormData, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={groupFormData.color}
                    onChange={e => setGroupFormData({ ...groupFormData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图标（可选）
                </label>
                <input
                  type="text"
                  value={groupFormData.icon}
                  onChange={e => setGroupFormData({ ...groupFormData, icon: e.target.value })}
                  placeholder="图标名称或 emoji"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述（可选）
                </label>
                <textarea
                  value={groupFormData.description}
                  onChange={e => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  placeholder="分组描述"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setEditingGroup(null);
                  setGroupFormData({ name: '', color: '', icon: '', description: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitGroup}
                className="flex-1 px-4 py-2 btn-mint rounded-lg text-white"
              >
                {editingGroup ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标签模态框 */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {editingTag ? '编辑标签' : '添加标签'}
              </h3>
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setEditingTag(null);
                  setTagFormData({ name: '', tagGroupId: '', color: '', icon: '' });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签名称 *
                </label>
                <input
                  type="text"
                  value={tagFormData.name}
                  onChange={e => setTagFormData({ ...tagFormData, name: e.target.value })}
                  placeholder="例如：红色、棉质、常用"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签分组
                </label>
                <select
                  value={tagFormData.tagGroupId}
                  onChange={e => setTagFormData({ ...tagFormData, tagGroupId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                >
                  <option value="">无分组</option>
                  {tagGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  颜色（可选）
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={tagFormData.color || '#3B82F6'}
                    onChange={e => setTagFormData({ ...tagFormData, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tagFormData.color}
                    onChange={e => setTagFormData({ ...tagFormData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图标（可选）
                </label>
                <input
                  type="text"
                  value={tagFormData.icon}
                  onChange={e => setTagFormData({ ...tagFormData, icon: e.target.value })}
                  placeholder="图标名称或 emoji"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setEditingTag(null);
                  setTagFormData({ name: '', tagGroupId: '', color: '', icon: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitTag}
                className="flex-1 px-4 py-2 btn-mint rounded-lg text-white"
              >
                {editingTag ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
