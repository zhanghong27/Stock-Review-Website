const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise'); // 改用 mysql2 驱动
const cors = require('cors');

// require('dotenv').config();
const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
    console.error('❌ .env 加载失败:', result.error);
  } else {
    console.log('✅ .env 内容:', result.parsed);
  }

console.log('========= ENV Variables =========');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('===============================');

const app = express();
const port = process.env.PORT || 3000;

// ==================== TiDB 连接配置 ====================
const pool = mysql.createPool({
  host: process.env.DB_HOST,     // TiDB Cloud 地址示例：gateway01.ap-northeast-1.prod.aws.tidbcloud.com
  port: process.env.DB_PORT || 4000, // TiDB 默认端口 4000
  user: process.env.DB_USER,     // 注意：TiDB Cloud 用户名格式为 {用户名}.{集群名}
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,      // 连接池配置
  connectionLimit: 10,           // 根据业务压力调整
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false    // 必须启用 SSL 但允许自签名证书（TiDB Cloud 要求）
  }
});

// 数据库连接测试（优化版）
pool.getConnection()
  .then((conn) => {
    console.log('✅ Database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    // 建议添加重试逻辑或进程退出
  });

// ==================== CORS 配置 ====================
const allowedOrigins = [
  'https://zhanghong27.github.io', 
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.options('*', cors());

// ==================== API 端点 ====================

// POST 端点 - 创建新记录
app.post('/api/stocks', async (req, res) => {
  try {
    console.log('📥 收到 POST 请求体:', JSON.stringify(req.body));

    const { date, open, close, high, low } = req.body;
    
    // 参数校验（新增）
    if (!date || isNaN(open) || isNaN(close)) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    // 执行插入（使用 MySQL 的 ? 占位符）
    const [result] = await pool.query(
      'INSERT INTO reviews (date, open, close, high, low) VALUES (?, ?, ?, ?, ?)',
      [date, Number(open), Number(close), Number(high), Number(low)]  // 确保数值类型
    );

    console.log('✅ 插入成功，ID:', result.insertId);

    // 获取新插入的记录（TiDB 的 LAST_INSERT_ID() 更高效）
    const [rows] = await pool.query(
      'SELECT * FROM reviews WHERE id = LAST_INSERT_ID()'  // 优化查询方式
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('⚠️ POST Error:', err.message);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

// GET 端点 - 获取所有记录
app.get('/api/stocks', async (req, res) => {
  try {
    // 添加分页参数示例（可选功能）
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      'SELECT * FROM reviews ORDER BY date DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    // 获取总记录数（可选）
    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM reviews');
    
    res.status(200).json({
      data: rows,
      pagination: {
        total: countRows[0].total,
        page,
        limit
      }
    });
  } catch (err) {
    console.error('⚠️ GET Error:', err.message);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

// ==================== 服务启动 ====================
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🔗 TiDB Connection: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
});

module.exports = pool;