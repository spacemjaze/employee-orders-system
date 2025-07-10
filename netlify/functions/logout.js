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

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'معرف الموظف مطلوب' 
            });
        }

        // تحديث جلسة تسجيل الدخول
        await pool.query(`
            UPDATE login_sessions 
            SET logout_time = CURRENT_TIMESTAMP,
                session_duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - login_time))/60
            WHERE employee_id = $1 
            AND logout_time IS NULL
            AND login_time >= CURRENT_DATE
        `, [employeeId]);

        res.json({
            success: true,
            message: 'تم تسجيل الخروج بنجاح'
        });

    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تسجيل الخروج: ' + error.message 
        });
    }
}
