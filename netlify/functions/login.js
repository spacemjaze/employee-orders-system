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
        console.log('Starting login process...');
        
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

        const { username, password } = JSON.parse(event.body);
        console.log('Login attempt for username:', username);
        
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

        console.log('Connecting to database...');
        
        // التحقق من الاتصال بقاعدة البيانات
        const testQuery = await pool.query('SELECT NOW()');
        console.log('Database connection successful:', testQuery.rows[0]);

        const result = await pool.query(
            'SELECT * FROM employees WHERE username = $1 AND is_active = TRUE',
            [username]
        );

        console.log('Query result:', result.rows.length, 'rows found');

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
        console.log('Employee found:', employee.name);
        
        // التحقق من كلمة المرور (مؤقتاً نستخدم النص العادي)
        const passwords = {
            'admin': 'admin123',
            'ahmed_thaer': 'ahmed123',
            'qutaiba_rashid': 'qutaiba123',
            'amer_abdullah': 'amer123',
            'osama_yassin': 'osama123',
            'montazer_mohammed': 'montazer123'
        };
        
        const passwordValid = passwords[username] === password;
        console.log('Password valid:', passwordValid);
        
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

        // تسجيل جلسة تسجيل الدخول
        try {
            await pool.query(
                'INSERT INTO login_sessions (employee_id, ip_address, user_agent) VALUES ($1, $2, $3)',
                [
                    employee.id, 
                    event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown',
                    event.headers['user-agent'] || 'unknown'
                ]
            );
            console.log('Login session recorded');
        } catch (sessionError) {
            console.log('Session recording failed:', sessionError.message);
            // نكمل حتى لو فشل تسجيل الجلسة
        }

        // الحصول على إحصائيات اليوم
        const today = new Date().toISOString().split('T')[0];
        let todayStats = { total_orders: 0 };
        
        try {
            const statsResult = await pool.query(
                'SELECT * FROM daily_stats WHERE employee_id = $1 AND date = $2',
                [employee.id, today]
            );
            todayStats = statsResult.rows[0] || { total_orders: 0 };
            console.log('Today stats loaded:', todayStats);
        } catch (statsError) {
            console.log('Stats loading failed:', statsError.message);
            // نكمل مع القيم الافتراضية
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
                    role: employee.role,
                    todayOrders: todayStats.total_orders,
                    lastLogin: new Date().toLocaleString('en-GB')
                }
            })
        };

    } catch (error) {
        console.error('Login error details:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'خطأ في الخادم: ' + error.message 
            })
        };
    }
};
