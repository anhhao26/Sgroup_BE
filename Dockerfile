# 1. Chọn Node base image
FROM node:18-alpine

# 2. Tạo folder làm việc
WORKDIR /app

# 3. Copy package.json + cài dependencies
COPY package*.json ./
RUN npm install --production

# 4. Copy toàn bộ source
COPY . .

# 5. Expose port (phải khớp .env PORT, mặc định 8000)
EXPOSE 8000

# 6. Khởi chạy app
CMD ["node", "src/server.js"]
