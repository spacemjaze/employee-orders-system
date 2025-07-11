const { Pool } = require('pg');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        console.log('Testing database connection...');

        if (!process.env.DATABASE_URL) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '❌ DATABASE_URL environment variable not found',
                    debug: {
                        availableEnvVars: Object.keys(process.env).filter(key => 
                            key.includes('DATABASE') || key.includes('SUPABASE')
                        )
                    }
                })
            };
        }

        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 1,
            idleTimeoutMillis: 5000,
            connectionTimeoutMillis: 10000,
        });

        // اختبار الاتصال الأساسي
        const timeTest = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Basic connection successful');

        // اختبار جداول النظام
        const tablesTest = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('employees', 'orders', 'login_sessions', 'daily_stats')
            ORDER BY table_name
        `);

        // اختبار بيانات الموظفين
        const employeesTest = await pool.query(`
            SELECT id, username, name, role 
            FROM employees 
            WHERE is_active = true 
            ORDER BY id
        `);

        // اختبار تسجيل الدخول
        const loginTest = await pool.query(`
            SELECT username, name 
            FROM employees 
            WHERE username = 'ahmed_thaer' AND is_active = true
        `);

        await pool.end();

        const tablesFound = tablesTest.rows.map(row => row.table_name);
        const requiredTables = ['employees', 'orders', 'login_sessions', 'daily_stats'];
        const allTablesExist = requiredTables.every(table => tablesFound.includes(table));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '🎉 Database connection and setup successful!',
                data: {
                    currentTime: timeTest.rows[0].current_time,
                    tablesFound: tablesFound,
                    allRequiredTablesExist: allTablesExist,
                    employeeCount: employeesTest.rows.length,
                    testUserExists: loginTest.rows.length > 0,
                    employees: employeesTest.rows
                },
                nextSteps: [
                    '1. Try logging in with username: ahmed_thaer, password: ahmed123',
                    '2. If login works, the system is ready!',
                    '3. If login fails, check the login function logs'
                ]
            })
        };

    } catch (error) {
        console.error('❌ Database test failed:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: '❌ Database connection failed',
                error: {
                    message: error.message,
                    code: error.code,
                    detail: error.detail
                },
                troubleshooting: [
                    'Check if DATABASE_URL is correctly set in Netlify environment variables',
                    'Verify the connection string format',
                    'Ensure Supabase database is accessible',
                    'Check if the password is correct'
                ]
            })
        };
    }
};
