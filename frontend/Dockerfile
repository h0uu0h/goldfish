# 阶段 1：构建前端
FROM node:18 AS builder
WORKDIR /app

# 复制依赖文件并安装依赖
COPY package*.json ./
RUN npm install

# 复制全部源码并构建
COPY . .
RUN npm run build

# 阶段 2：使用 Nginx 托管静态资源
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
