# 电脑已装 Docker — 获取 tar 并部署到 NAS

分两段：**先在电脑上生成 tar**，再**拷到 NAS 上导入并启动**。

---

## 一、在你这台电脑上（已装 Docker）

### 1. 确定 NAS 架构

- **arm64**：多数群晖、威联通、铁威马等  
- **amd64**：Intel/AMD 的 NAS  

不确定就先用 **arm64**。

### 2. 打开终端

- **Mac**：打开「终端」  
- **Windows**：打开「命令提示符」或「PowerShell」

### 3. 进入一个你想放 tar 的目录（例如桌面）

Mac：
```bash
cd ~/Desktop
```

Windows（桌面）：
```bash
cd %USERPROFILE%\Desktop
```

### 4. 拉取镜像并打包成 tar（整段复制，一次执行）

**NAS 是 arm64 时用这段：**
```bash
docker pull --platform linux/arm64 debian:bookworm-slim
docker pull --platform linux/arm64 node:20-bookworm
docker pull --platform linux/arm64 node:20-bookworm-slim
docker save -o ws-scrcpy-base-images.tar debian:bookworm-slim node:20-bookworm node:20-bookworm-slim
```

**NAS 是 Intel/AMD（amd64）时用这段：**
```bash
docker pull --platform linux/amd64 debian:bookworm-slim
docker pull --platform linux/amd64 node:20-bookworm
docker pull --platform linux/amd64 node:20-bookworm-slim
docker save -o ws-scrcpy-base-images.tar debian:bookworm-slim node:20-bookworm node:20-bookworm-slim
```

等几分钟，当前目录会出现 **ws-scrcpy-base-images.tar**（几百 MB）。

### 5. 把 tar 拷到 NAS

用 U 盘、共享文件夹、网盘等，把 **ws-scrcpy-base-images.tar** 拷到 NAS 的**项目目录**（和 `启动.sh`、`Dockerfile` 同一层）。

---

## 二、在 NAS 上

### 1. SSH 登录 NAS

用终端或 SSH 工具连上 NAS。

### 2. 进入项目目录

例如（路径按你实际改）：
```bash
cd /tmp/zfsv3/nvme11/18518486905/data/Docker/ws-scrcpy
```

### 3. 导入镜像并启动

```bash
docker load -i ws-scrcpy-base-images.tar
bash 启动.sh
```

等构建跑完（第一次可能要 20～40 分钟），浏览器访问 **http://NAS的IP:8000** 即可。

---

## 小结

| 在哪里 | 做什么 |
|--------|--------|
| **电脑** | 终端执行上面的 `docker pull` + `docker save`，得到 `ws-scrcpy-base-images.tar` |
| **电脑 → NAS** | 把 `ws-scrcpy-base-images.tar` 拷到 NAS 项目目录 |
| **NAS** | `docker load -i ws-scrcpy-base-images.tar`，再 `bash 启动.sh` |
