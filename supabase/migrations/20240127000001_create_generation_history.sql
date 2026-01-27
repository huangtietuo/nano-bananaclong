-- 创建生成历史记录表
CREATE TABLE IF NOT EXISTS generation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image-edit', 'text-to-image', 'video-generation')),
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  aspect_ratio TEXT,
  resolution TEXT,
  duration TEXT,
  output_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  credits INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'processing', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_history_type ON generation_history(type);
CREATE INDEX IF NOT EXISTS idx_generation_history_status ON generation_history(status);

-- 创建复合索引
CREATE INDEX IF NOT EXISTS idx_generation_history_user_created ON generation_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_type ON generation_history(user_id, type);

-- 启用行级安全策略
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的历史记录
CREATE POLICY "Users can view own history" ON generation_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON generation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON generation_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON generation_history
  FOR DELETE USING (auth.uid() = user_id);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generation_history_updated_at
  BEFORE UPDATE ON generation_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();