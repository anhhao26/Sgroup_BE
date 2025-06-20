# Sử dụng Node.js base image
FROM node:18

# Tạo thư mục trong container
WORKDIR /app

# Copy package.json và cài dependency
COPY package*.json ./
RUN npm install

# Copy toàn bộ project vào container
COPY . .

# Expose cổng mà app của bạn dùng (8000 nếu bạn config app chạy cổng này)
EXPOSE 8000

# Lệnh khởi chạy app
CMD ["node", "src/server.js"]
