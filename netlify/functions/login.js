const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
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
        const { username, password } = JSON.parse(event.body);
        
        if (!username || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'يرجى إدخال اسم المستخدم وكلمة المرور' 
                })
            };
        }

        const result = await pool.query(
            'SELECT * FROM employees WHERE username = $1 AND is_active = TRUE',
            [username]
        );

        if (result.rows.length === 0) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'اسم المستخدم غير صحيح' 
                })
            };
        }

        const employee = result.rows[0];
        
        // التحقق من كلمة المرور
        const passwords = {
            'admin': 'admin123',
            'ahmed_thaer': 'ahmed123',
            'qutaiba_rashid': 'qutaiba123',
            'amer_abdullah': 'amer123',
            'osama_yassin': 'osama123',
            'montazer_mohammed': 'montazer123'
        };
        
        const passwordValid = passwords[username] === password;
        
        if (!passwordValid) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'كلمة المرور غير صحيحة' 
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                employee: {
                    id: employee.id,
                    name: employee.name,
                    employee_id: employee.employee_id,
                    username: employee.username,
                    role: employee.role
                }
            })
        };

    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'خطأ في الخادم' 
            })
        };
    }
};
