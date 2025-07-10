const { Pool } = require('pg');

// إعداد الاتصال بقاعدة البيانات
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

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        // استخراج المعاملات من query parameters
        const { employeeId, limit = 10, offset = 0 } = event.queryStringParameters || {};
        
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                orders: result.rows,
                total: result.rows.length
            })
        };

    } catch (error) {
        console.error('خطأ في جلب الأوردرات:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'خطأ في جلب الأوردرات: ' + error.message 
            })
        };
    }
};
