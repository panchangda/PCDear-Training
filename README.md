# PCDear-Training

一个用于音乐音程训练的 Web 应用，帮助用户提高音程识别能力。

## 功能特性

- 支持旋律音程和和声音程的练习
- 提供多种音程类别的练习（小二度、大二度、小三度等）
- 实时音频播放和反馈
- 支持单个音符的分离播放（和声音程）
- 显示音高信息
- 计分系统

## 技术栈

- Vue.js
- uni-app
- Python (用于音频生成)

## 项目结构

```
PCDear-Training/
├── components/          # Vue 组件
├── pages/              # 页面文件
├── static/             # 静态资源
├── utils/              # 工具函数
└── scripts/            # Python 脚本
```

## 开发环境设置

1. 克隆仓库
```bash
git clone https://github.com/yourusername/PCDear-Training.git
cd PCDear-Training
```

2. 安装依赖
```bash
npm install
```

3. 生成音频文件
```bash
python scripts/generate_intervals.py
```

4. 运行开发服务器
```bash
npm run dev
```

## 音频生成

项目使用 Python 脚本生成音频文件。音频文件生成后需要放置在 `static/audio/` 目录下。

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License 