# Docker 拉取超时（TLS handshake timeout）— 配置镜像加速

报错类似：
```text
"https://registry-1.docker.io/v2/": net/http: TLS handshake timeout
```
说明连不上 Docker 官方仓库，在国内很常见。给 Docker 配**镜像加速**即可。

---

## 一、在 NAS 上配置 Docker 镜像加速

### 1. 找到 Docker 的配置文件

- 常见路径：**`/etc/docker/daemon.json`**
- 群晖：在 Docker 套件里可能有「注册表」→「编辑 daemon.json」或类似入口。
- 威联通 / 绿联 / 铁威马等：SSH 进 NAS 后执行：
  ```bash
  cat /etc/docker/daemon.json
  ```
  若提示文件不存在，就新建这个文件。

### 2. 编辑 daemon.json

在 SSH 里执行（先备份再改）：
```bash
cp /etc/docker/daemon.json /etc/docker/daemon.json.bak 2>/dev/null || true
```

用 `nano` 或 `vi` 编辑（示例用 nano）：
```bash
nano /etc/docker/daemon.json
```

**若文件是空的或只有 `{}`**，写成（任选一个镜像源）：

阿里云（推荐，需先登录阿里云容器镜像服务控制台获取你的专属地址，或先用下面这个公共示例）：
```json
{
  "registry-mirrors": [
    "https://你的阿里云镜像加速地址.mirror.aliyuncs.com"
  ]
}
```

或 腾讯云：
```json
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
```

或 中科大：
```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```

**若文件里已有内容**（例如已有 `"log-driver"` 等），只加 `registry-mirrors`，不要删原有项。例如原来长这样：
```json
{
  "log-driver": "json-file"
}
```
改成：
```json
{
  "log-driver": "json-file",
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
```
保存退出（nano：`Ctrl+O` 回车，`Ctrl+X`）。

### 3. 重启 Docker

- **群晖**：套件中心 → 停用 Docker → 再启用。
- **SSH**（很多 NAS 通用）：
  ```bash
  systemctl restart docker
  ```
  或：
  ```bash
  /etc/init.d/docker restart
  ```
  具体以你 NAS 的说明为准。

### 4. 再执行构建

回到项目目录执行：
```bash
bash 启动.sh
```

---

## 二、阿里云专属加速地址（可选）

1. 打开 [阿里云 - 容器镜像服务](https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors)。
2. 登录后左侧选「镜像加速器」。
3. 复制你的「加速器地址」（每人一个）。
4. 在 `daemon.json` 的 `registry-mirrors` 里只填这个地址，例如：
   ```json
   "registry-mirrors": ["https://xxxxxx.mirror.aliyuncs.com"]
   ```
5. 保存并重启 Docker，再运行 `bash 启动.sh`。

---

## 三、若仍然超时：先试「换基础镜像」

当前 Dockerfile 已改为用 **Debian + 自带 OpenJDK 17**，不再用 `eclipse-temurin`，构建时只会拉 **debian:bookworm-slim**，国内镜像加速对 Debian 支持一般更好。请直接再执行一次：

```bash
bash 启动.sh
```

若还是卡在拉取 debian 或 node 镜像，用下面**四、离线导入**。

---

## 四、仍超时：在能联网的电脑上拉镜像，再导入 NAS（离线法）

NAS 完全不连 Docker Hub，由**能正常访问外网（或开 VPN）的电脑**先拉好镜像，导出成文件，拷到 NAS 再导入。

### 步骤 1：在电脑上得到镜像 tar（两种方式二选一）

**先确定你 NAS 是 arm64 还是 x86**：arm64 用下面命令里的 `arm64`，Intel/AMD 用 `amd64`。

---

**方式 A：电脑已装 Docker**

打开终端，执行（NAS 是 x86 就把 `arm64` 改成 `amd64`）：

```bash
docker pull --platform linux/arm64 debian:bookworm-slim
docker pull --platform linux/arm64 node:20-bookworm
docker pull --platform linux/arm64 node:20-bookworm-slim
docker save -o ws-scrcpy-base-images.tar debian:bookworm-slim node:20-bookworm node:20-bookworm-slim
```

会在当前目录得到 **`ws-scrcpy-base-images.tar`**（几百 MB）。然后跳到步骤 2。

---

**方式 B：电脑没装 Docker，用 Skopeo（不用装 Docker）**

Skopeo 是命令行工具，可以拉镜像并导出成 tar，**不需要安装 Docker**。

1. **安装 Skopeo**
   - **Mac**：打开终端执行 `brew install skopeo`（需先装 [Homebrew](https://brew.sh)）。
   - **Windows**：到 [WinSkopeo  releases](https://github.com/passcod/winskopeo/releases) 下载最新 zip，解压后把里面的 `skopeo.exe` 放到任意文件夹，并在终端里进入该文件夹再执行下面命令（或把该文件夹加入系统 PATH）。
   - **Linux**：`sudo apt install skopeo` 或 `sudo yum install skopeo`。

2. **在终端里执行**（先 `cd` 到一个你想放 tar 的目录；NAS 是 **x86** 就把下面三处 `arm64` 改成 `amd64`）：

   ```bash
   skopeo copy --override-arch=arm64 --override-os=linux docker://docker.io/library/debian:bookworm-slim docker-archive:debian-bookworm-slim.tar
   skopeo copy --override-arch=arm64 --override-os=linux docker://docker.io/library/node:20-bookworm docker-archive:node-20-bookworm.tar
   skopeo copy --override-arch=arm64 --override-os=linux docker://docker.io/library/node:20-bookworm-slim docker-archive:node-20-bookworm-slim.tar
   ```

   会得到 **3 个 tar 文件**：`debian-bookworm-slim.tar`、`node-20-bookworm.tar`、`node-20-bookworm-slim.tar`。把这 3 个文件都拷到 NAS（见步骤 2）。在 NAS 上**依次**执行（步骤 3 会写）。

---

**方式 C：用别人的电脑或云服务器**

在能装 Docker 的电脑（朋友/公司/网吧 或 按量付费的云服务器）上，用方式 A 生成 `ws-scrcpy-base-images.tar`，再下载到你本机，拷到 NAS。

---

**方式 D：用 GitHub 自动生成（推荐，Mac 不用装任何东西）**

项目里已带 GitHub Actions 配置，**把项目推到 GitHub 后**，在网页上点几下就能生成 tar 并下载。

1. **把当前项目推到 GitHub**  
   - 若还没有仓库：在 [GitHub 新建仓库](https://github.com/new)，然后在本机项目目录执行（把 `你的用户名/你的仓库名` 换成实际地址）：
     ```bash
     git init
     git add .
     git commit -m "add workflow"
     git remote add origin https://github.com/你的用户名/你的仓库名.git
     git branch -M main
     git push -u origin main
     ```
   - 若已有仓库：确保包含 `.github/workflows/build-base-images.yml` 后 `git add`、`git commit`、`git push`。

2. **在 GitHub 网页上** 打开你的仓库 → 顶部点 **「Actions」** → 左侧选 **「生成 ws-scrcpy 基础镜像 tar」**。

3. 右侧点 **「Run workflow」**，在 **「NAS 架构」** 里选 **arm64** 或 **amd64**（和你 NAS 一致），再点绿色的 **「Run workflow」**。

4. 等约 **5～10 分钟**，该次运行会变绿（完成）。点进这次运行，页面下方 **「Artifacts」** 里会出现 **ws-scrcpy-base-arm64** 或 **ws-scrcpy-base-amd64**，点它即可**下载 zip**（里面是 `ws-scrcpy-base-images.tar`，解压后得到 tar）。

5. 把 **`ws-scrcpy-base-images.tar`** 拷到 NAS，在 NAS 上执行 **步骤 3**（只导入一个 tar 的那种）、再执行 **步骤 4** 即可。

### 步骤 2：把 tar 拷到 NAS

- **方式 A/C**：把 **`ws-scrcpy-base-images.tar`** 一个文件拷到 NAS（U 盘、SMB、scp 等），例如项目目录。
- **方式 B（Skopeo）**：把 **`debian-bookworm-slim.tar`**、**`node-20-bookworm.tar`**、**`node-20-bookworm-slim.tar`** 三个文件都拷到 NAS 同一目录（例如项目目录）。

### 步骤 3：在 NAS 上导入镜像

SSH 登录 NAS，进入你放 tar 的目录（例如项目目录），然后：

- **若你只有一个文件 `ws-scrcpy-base-images.tar`**（方式 A/C）：
  ```bash
  docker load -i ws-scrcpy-base-images.tar
  ```

- **若你有三个 tar 文件**（方式 B Skopeo），**依次**执行：
  ```bash
  docker load -i debian-bookworm-slim.tar
  docker load -i node-20-bookworm.tar
  docker load -i node-20-bookworm-slim.tar
  ```

看到 “Loaded image: debian:bookworm-slim” 等提示即表示成功。

### 步骤 4：在 NAS 上再构建

进入项目目录执行：

```bash
bash 启动.sh
```

此时构建会直接用本机已导入的镜像，**不会再访问 Docker Hub**，就不会再出现 TLS handshake timeout。
