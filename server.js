// server.js
require('dotenv').config();
const { connectDB, closeDB } = require('./src/config/db');

const PORT = process.env.PORT || 3000;
let app;

async function start() {
  try {
    //MongoDB 연결
    await connectDB(process.env.MONGODB_URI, process.env.DB_NAME);
    console.log('✅ MongoDB connected');

    //모델이 연결 전에 로드됐을 가능성 제거
    delete require.cache[require.resolve('./src/models/restaurant.model')];

    //연결 후 app 및 service 로드
    const createApp = require('./src/app');
    const { ensureSeededOnce } = require('./src/services/restaurants.service');

    //앱 생성 및 시드 데이터 확인
    app = createApp();
    await ensureSeededOnce();

    //서버 실행
    app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

    //module.exports (테스트용)
    module.exports = app;

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

//graceful shutdown (한 번만 등록)
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down...');
  await closeDB();
  process.exit(0);
});

//서버 실행
start();
