# 三维高斯场景多天气可控合成项目主页

这是一个面向计算机图形学论文的中文静态 Project Page，用于展示论文摘要、方法框架、多天气视频对比、可控天气强度、定量结果与 2AFC 用户研究结果。

网页仅使用 HTML、CSS 和原生 JavaScript，不需要 npm、构建工具、后端或数据库，可直接部署到 GitHub Pages。

## 本地预览

最简单的方式是双击 **index.html**。标题、摘要、图片、视频与交互控件均可离线显示；网页已在 HTML 中嵌入经过核对的中文摘要，因此不受本地页面读取文本文件限制。

也可以使用本地静态服务器预览。在 Windows 的 project-page 目录打开终端后运行：

~~~powershell
py -m http.server 8000
~~~

如果系统没有 Python Launcher，也可以使用 python -m http.server 8000。然后访问 http://localhost:8000/。这只是本地预览方式，不是构建步骤。

## 文件结构

~~~text
project-page/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    ├── images/
    │   ├── framework.png
    │   ├── quantitative_results.png
    │   └── user_study_overall.png
    ├── text/
    │   └── abstract.txt
    └── videos/
        ├── original/
        │   ├── garden.mp4
        │   ├── bicycle.mp4
        │   ├── treehill.mp4
        │   └── truck.mp4
        ├── weather/
        │   ├── snow/{garden,bicycle,treehill,truck}/
        │   ├── rain/{garden,bicycle,treehill,truck}/
        │   └── fog/{garden,bicycle,treehill,truck}/
        └── control/
~~~

每个天气/场景目录中的方法视频统一命名为：

~~~text
ours.mp4
weatheredit.mp4
climatenerf.mp4
ditto.mp4
vace.mp4
~~~

网页显示名称统一为 **Ditto**；即使原素材写作 **Editto**，复制到网页目录时也应命名为 **ditto.mp4**。

Snow 和 Fog 使用 ClimateNeRF；Rain 使用 RainyGS。为保持五列交互结构，RainyGS 视频保存在对应目录的 **climatenerf.mp4** 比较槽位中，页面在切换到雨天时会自动将按钮显示为 **RainyGS**。

## 替换或补充视频

天气模拟区域使用可拖拽的 Before/After 对比：左侧原始场景视频放在 `assets/videos/original/{scene}.mp4`，右侧天气结果使用下面的路径。两段视频会静音循环播放并自动保持时间同步。

天气对比视频使用以下相对路径：

~~~text
assets/videos/weather/{weather}/{scene}/{method}.mp4
~~~

例如，雪天 Garden 场景的本文方法视频为：

~~~text
assets/videos/weather/snow/garden/ours.mp4
~~~

可控天气视频放在 assets/videos/control/ 中，共使用以下 9 个文件名：

~~~text
snow_low.mp4
snow_medium.mp4
snow_high.mp4
rain_low.mp4
rain_medium.mp4
rain_high.mp4
fog_low.mp4
fog_medium.mp4
fog_high.mp4
~~~

如果文件缺失，播放器会自动显示“暂无该组合的视频结果”或“暂无该强度结果”，不会影响页面其他部分。

推荐使用 MP4、H.264、30 fps、yuv420p 像素格式，并移除音频。若浏览器无法播放某段素材，可新建转码文件，不要覆盖原始视频：

~~~powershell
ffmpeg -i input.mp4 -c:v libx264 -pix_fmt yuv420p -an output.mp4
~~~

## 替换标题、作者和项目链接

在 index.html 中修改：

- h1：中文论文标题；
- .english-title：英文标题；
- .authors：作者姓名；
- .affiliation：单位；
- “论文 / 代码 / 视频”三个链接的 href。

添加真实链接后，同时删除对应链接的 is-disabled 类、aria-disabled="true" 与 data-disabled-link 属性。没有真实链接时请保留 href="#" 和禁用状态。

摘要文本写入 assets/text/abstract.txt。图片文件分别替换为：

- assets/images/framework.png
- assets/images/quantitative_results.png
- assets/images/user_study_overall.png

不要改动定量指标或用户研究数值，除非论文数据已经正式更新。

## 部署到 GitHub Pages

将 project-page 目录内的全部内容放到 GitHub 仓库根目录并推送到 main 分支。无需运行 npm 或任何构建命令。

在仓库网页依次打开：

1. **Settings**
2. **Pages**
3. **Build and deployment**
4. **Source** 选择 **Deploy from a branch**
5. **Branch** 选择 **main**
6. **Folder** 选择 **/ (root)**
7. 点击 **Save**

部署完成后访问：

~~~text
https://用户名.github.io/仓库名/
~~~

页面资源均使用相对路径，因此可以直接在项目站点子路径下工作。
