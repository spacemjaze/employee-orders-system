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
        const { employeeId } = req.query;
        
        if (!employeeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'معرف الموظف مطلوب' 
            });
        }

        const today = new Date().toISOString().split('T')[0];

        // إحصائيات اليوم
        const todayResult = await pool.query(
            'SELECT * FROM daily_stats WHERE employee_id = $1 AND date = $2',
            [employeeId, today]
        );

        // إحصائيات عامة
        const totalResult = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'مكتمل' THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status = 'غير مكتمل' THEN 1 ELSE 0 END) as incomplete_orders
            FROM orders 
            WHERE employee_id = $1
        `, [employeeId]);

        // آخر 5 أوردرات
        const recentResult = await pool.query(`
            SELECT 
                order_type, 
                order_details, 
                status, 
                created_at,
                TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_date
            FROM orders 
            WHERE employee_id = $1 
            ORDER BY created_at DESC 
            LIMIT 5
        `, [employeeId]);

        res.json({
            success: true,
            todayStats: todayResult.rows[0] || { 
                total_orders: 0, 
                completed_orders: 0, 
                incomplete_orders: 0 
            },
            totalStats: totalResult.rows[0] || {
                total_orders: 0,
                completed_orders: 0,
                incomplete_orders: 0
            },
            recentOrders: recentResult.rows
        });

    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الإحصائيات: ' + error.message 
        });
    }
}
