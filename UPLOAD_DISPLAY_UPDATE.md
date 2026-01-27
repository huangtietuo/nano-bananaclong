# 图片上传展示逻辑更新

## 🎯 更新需求
统一生成器模块与AI视频模块的图片上传展示逻辑：
- **上传前**: 显示上传区域 + 资产库选择
- **上传后**: 图片占据整个空间，资产库隐藏
- **删除后**: 恢复到上传前的状态

## ✅ 实现的改进

### 1. 主图片上传区域 (图像转视频)

#### 上传前状态
```jsx
<div className="flex gap-3">
  {/* 上传区域 - 小尺寸 */}
  <div className="w-24 h-24 border-2 border-dashed...">
    <Upload /> 上传图片
  </div>
  
  {/* 资产库 - 小尺寸 */}
  <div className="w-24 h-24 border-2 border-dashed border-yellow-500...">
    <Database /> 资产库
  </div>
</div>
```

#### 上传后状态
```jsx
{/* 图片占据整个空间 */}
<div className="w-full h-32 border-2 border-dashed...">
  <img src={uploadedVideoImage} className="w-full h-full object-cover" />
  <button onClick={handleDelete}>删除</button>
  <div className="hover-overlay">
    <Upload /> {/* 重新上传提示 */}
  </div>
</div>
```

### 2. 结束帧上传区域 (高级设置)

#### 上传前状态
```jsx
<div className="flex gap-3">
  {/* 上传区域 - 大尺寸 */}
  <div className="flex-3 min-h-40 border-2 border-dashed...">
    <Upload /> 上传结束帧图像
  </div>
  
  {/* 资产库 - 小尺寸 */}
  <div className="flex-1 min-h-40 border-2 border-dashed border-yellow-500...">
    <Database /> Asset Library
  </div>
</div>
```

#### 上传后状态
```jsx
{/* 图片占据整个空间 */}
<div className="w-full min-h-40 border-2 border-dashed...">
  <img src={uploadedEndFrame} className="w-full h-full object-cover" />
  <button onClick={handleDeleteEndFrame}>删除</button>
  <div className="hover-overlay">
    <Upload /> {/* 重新上传提示 */}
  </div>
</div>
```

## 🔄 状态转换逻辑

### 主图片上传流程
```
初始状态: [上传区域] + [资产库]
    ↓ 用户上传图片
上传状态: [────── 图片预览 ──────]
    ↓ 用户删除图片  
初始状态: [上传区域] + [资产库]
```

### 结束帧上传流程
```
初始状态: [──── 上传区域 ────] + [资产库]
    ↓ 用户上传图片
上传状态: [────────── 图片预览 ──────────]
    ↓ 用户删除图片
初始状态: [──── 上传区域 ────] + [资产库]
```

## 🎨 视觉设计特点

### 上传前
- **双区域布局**: 上传 + 资产库并排显示
- **视觉区分**: 不同的边框颜色和背景
- **功能提示**: 清晰的图标和文字说明

### 上传后
- **全宽显示**: 图片占据整个可用空间
- **交互反馈**: 悬停显示重新上传提示
- **删除功能**: 右上角红色删除按钮
- **无资产库**: 资产库完全隐藏

### 交互体验
- **点击上传**: 整个区域可点击触发文件选择
- **悬停效果**: 半透明遮罩 + 上传图标
- **删除确认**: 点击删除按钮立即移除图片
- **状态恢复**: 删除后自动恢复到初始布局

## 📱 响应式适配

### 桌面端
- 主图片: 全宽 × 128px 高度
- 结束帧: 全宽 × 最小160px 高度
- 删除按钮: 32×32px，右上角定位

### 移动端
- 保持相同的布局逻辑
- 触摸友好的按钮尺寸
- 适当的间距和字体大小

## 🔧 技术实现

### 条件渲染逻辑
```typescript
{uploadedVideoImage ? (
  // 上传后：全宽图片显示
  <div className="w-full h-32...">
    <img src={uploadedVideoImage} />
    <button onClick={handleDelete} />
  </div>
) : (
  // 上传前：双区域布局
  <div className="flex gap-3">
    <div className="upload-area" />
    <div className="asset-library" />
  </div>
)}
```

### 状态管理
```typescript
// 独立的状态变量
const [uploadedVideoImage, setUploadedVideoImage] = useState<string | null>(null)
const [uploadedEndFrame, setUploadedEndFrame] = useState<string | null>(null)

// 删除操作重置状态
const handleDeleteVideoImage = () => {
  setUploadedVideoImage(null) // 自动触发UI重新渲染
}
```

## 🎯 用户体验改进

### 直观的状态反馈
- **空状态**: 清晰的上传提示和资产库选项
- **有内容**: 专注于图片预览和管理
- **状态切换**: 平滑的过渡动画

### 功能可发现性
- **资产库**: 只在需要时显示，避免界面混乱
- **重新上传**: 悬停时显示，不占用额外空间
- **删除操作**: 明显的视觉提示，防止误操作

### 一致性体验
- **统一逻辑**: 主图片和结束帧使用相同的展示模式
- **视觉统一**: 相同的样式、动画和交互模式
- **行为预期**: 用户学会一个区域的操作后，其他区域行为一致

## 📊 对比总结

| 状态 | 布局 | 资产库 | 图片尺寸 | 交互 |
|------|------|--------|----------|------|
| 上传前 | 双区域 | ✅ 显示 | 小尺寸预览 | 选择上传/资产库 |
| 上传后 | 单区域 | ❌ 隐藏 | 全宽显示 | 重新上传/删除 |

这种设计让用户在不同状态下都有清晰的操作路径，同时最大化了图片预览的视觉效果。

---

**更新状态**: ✅ 完成
**测试状态**: ✅ 通过  
**用户体验**: ✅ 优化