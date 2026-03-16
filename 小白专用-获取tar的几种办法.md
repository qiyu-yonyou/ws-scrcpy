# 卡在「获取 ws-scrcpy-base-images.tar」？用下面任一办法

任选**一种**你能做到的就行，不用全试。

---

## 办法一：找朋友或同事帮忙（最省事）

你身边有人电脑上**已经装了 Docker** 的话，用这个：

1. 把项目里的 **「请朋友帮忙生成tar-说明.txt」** 发给他。
2. 告诉他你的 NAS 是 **arm64** 还是 **amd64**（不知道就先说 **arm64**，多数家用 NAS 都是）。
3. 他按说明在终端执行几行命令，会得到一个 **ws-scrcpy-base-images.tar**，用 U 盘或网盘发给你。
4. 你把这份 tar 拷到 NAS，在 NAS 上执行：
   ```bash
   docker load -i ws-scrcpy-base-images.tar
   cd /你的/项目/路径
   bash 启动.sh
   ```

---

## 办法二：用 GitHub 网页（不用本机装 Git/Docker）

**不用在你自己电脑上敲任何命令**，全在浏览器里完成。

### 第一步：把「带 workflow 的文件夹」放到 GitHub

1. 打开 https://github.com/new ，登录后新建一个仓库，名字随便（例如 `ws-scrcpy`），**不要**勾选「Add a README」，点创建。
2. 在你自己电脑上，找到你的 **ws-scrcpy 项目文件夹**（里面要有 `.github` 文件夹）。
3. 把 **整个项目文件夹** 打成 **zip**（右键 → 压缩，或「发送到 → 压缩文件夹」）。
4. 回到 GitHub 新建的仓库页面，点 **「uploading an existing file」** 或 **「Add file」→「Upload files」**。
5. 把 zip **拖进去**（或选择文件），等上传完，点 **「Commit changes」**。  
   （如果 GitHub 不让你直接传 zip，就**解压 zip**，把解压出来的**所有文件和文件夹**一起拖进网页上传。）

这样仓库里就有 `.github/workflows/build-base-images.yml` 了。

### 第二步：在网页上运行一次，生成 tar

1. 在你这个仓库页面，点顶上的 **「Actions」**。
2. 左边点 **「生成 ws-scrcpy 基础镜像 tar」**。
3. 右边点 **「Run workflow」**，在 **「NAS 架构」** 里选 **arm64** 或 **amd64**（不确定就选 **arm64**），再点绿色 **「Run workflow」**。
4. 等 5～10 分钟，这一条运行变绿（完成）后：
   - 点进这次运行；
   - 往下拉，在 **「Artifacts」** 里点 **ws-scrcpy-base-arm64** 或 **ws-scrcpy-base-amd64** 下载（是一个 zip）；
   - 或者点 **「Releases」**（仓库顶栏或右侧），在最新 Release 里下载 **ws-scrcpy-base-images.tar**（直接是 tar，不用解压 zip）。

### 第三步：把 tar 拷到 NAS 并用

1. 把 **ws-scrcpy-base-images.tar** 拷到 NAS（U 盘、共享文件夹等）。
2. SSH 进 NAS，进入你放 tar 的目录（例如项目目录），执行：
   ```bash
   docker load -i ws-scrcpy-base-images.tar
   bash 启动.sh
   ```

---

## 办法三：你已经有了 tar，但不知道在 NAS 上怎么用

如果你**已经**通过别的途径拿到了 **ws-scrcpy-base-images.tar**：

1. 用 U 盘或共享文件夹，把 **ws-scrcpy-base-images.tar** 拷到 NAS 的**项目目录**（和 `启动.sh`、`Dockerfile` 同一层）。
2. SSH 登录 NAS，执行：
   ```bash
   cd /你的/项目/路径
   docker load -i ws-scrcpy-base-images.tar
   bash 启动.sh
   ```
   （`/你的/项目/路径` 换成你 NAS 上实际路径，例如 `/tmp/zfsv3/nvme11/18518486905/data/Docker/ws-scrcpy`。）

---

## 还是不行？

- **办法一**：只要有一个能跑 Docker 的人帮你一次就行。
- **办法二**：只要你能用浏览器上传文件夹到 GitHub、点 Actions 和下载，不需要本机装任何软件。
- 若你既没有能帮忙的人，GitHub 也一直报错，可以把你**具体卡在哪一步、页面/报错长什么样**（截图或复制文字）发出来，再针对性写步骤。
