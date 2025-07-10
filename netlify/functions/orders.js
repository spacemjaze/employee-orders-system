const { Pool } = require('pg');

// إعداد الاتصال بقاعدة البيانات
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export default async function handler(req, res) {
    // إعداد CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { employeeId, limit = 10, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                o.*,
                e.name as employee_name,
                e.employee_id as emp_id,
                TO_CHAR(o.created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_date
            FROM orders o
            JOIN employees e ON o.employee_id = e.id
        `;
        let params = [];

        if (employeeId) {
            query += ' WHERE o.employee_id = $1';
            params.push(employeeId);
        }

        query += ' ORDER BY o.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        res.json({
            success: true,
            orders: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('خطأ في جلب الأوردرات:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الأوردرات: ' + error.message 
        });
    }
}
