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
        const {
            employeeId,
            orderType,
            orderDetails,
            senderName,
            locationLatitude,
            locationLongitude,
            locationAccuracy,
            photoData,
            status,
            incompleteReason,
            sessionId,
            orderStartTime,
            orderEndTime,
            orderDurationMs
        } = req.body;

        // التحقق من البيانات المطلوبة
        if (!employeeId || !orderType || !orderDetails || !senderName) {
            return res.status(400).json({ 
                success: false, 
                message: 'بيانات غير مكتملة' 
            });
        }

        // إدراج الأوردر في قاعدة البيانات
        const result = await pool.query(`
            INSERT INTO orders (
                employee_id, order_type, order_details, sender_name,
                location_latitude, location_longitude, location_accuracy,
                photo_data, status, incomplete_reason, session_id,
                order_start_time, order_end_time, order_duration_ms
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `, [
            employeeId, orderType, orderDetails, senderName,
            locationLatitude || null, locationLongitude || null, locationAccuracy || null,
            photoData || null, status || 'مكتمل', incompleteReason || null, sessionId,
            orderStartTime || null, orderEndTime || null, orderDurationMs || null
        ]);

        // تحديث الإحصائيات اليومية
        const today = new Date().toISOString().split('T')[0];
        await pool.query(`
            INSERT INTO daily_stats (employee_id, date, total_orders, completed_orders, incomplete_orders)
            VALUES ($1, $2, 1, $3, $4)
            ON CONFLICT (employee_id, date) 
            DO UPDATE SET 
                total_orders = daily_stats.total_orders + 1,
                completed_orders = daily_stats.completed_orders + $3,
                incomplete_orders = daily_stats.incomplete_orders + $4,
                updated_at = CURRENT_TIMESTAMP
        `, [
            employeeId, 
            today, 
            status === 'مكتمل' ? 1 : 0, 
            status === 'غير مكتمل' ? 1 : 0
        ]);

        res.json({
            success: true,
            message: 'تم حفظ الأوردر بنجاح',
            orderId: result.rows[0].id
        });

    } catch (error) {
        console.error('خطأ في حفظ الأوردر:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في حفظ الأوردر: ' + error.message 
        });
    }
}
