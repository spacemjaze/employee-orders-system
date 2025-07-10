const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'لا توجد بيانات في الطلب' 
                })
            };
        }

        const { employeeId } = JSON.parse(event.body);

        if (!employeeId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'معرف الموظف مطلوب' 
                })
            };
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'تم تسجيل الخروج بنجاح'
            })
        };

    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'خطأ في تسجيل الخروج: ' + error.message 
            })
        };
    }
};
