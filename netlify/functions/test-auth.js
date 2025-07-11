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

    // اختبار URLs مختلفة مع أنواع مختلفة من المصادقة
    const testConfigs = [
        // Connection pooling مع project ID في username
        {
            name: 'Connection Pooling (us-east-1)',
            url: `postgresql://postgres.hemfegaipidqqojuasdc:sHhS7r8LwXPlSXO@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
        },
        {
            name: 'Connection Pooling (us-west-1)', 
            url: `postgresql://postgres.hemfegaipidqqojuasdc:sHhS7r8LwXPlSXO@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
        },
        {
            name: 'Connection Pooling (eu-west-1)',
            url: `postgresql://postgres.hemfegaipidqqojuasdc:sHhS7r8LwXPlSXO@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`
        },
        // Direct connection (للمقارنة)
        {
            name: 'Direct Connection',
            url: `postgresql://postgres:sHhS7r8LwXPlSXO@db.hemfegaipidqqojuasdc.supabase.co:5432/postgres`
        }
    ];

    const results = [];

    for (const config of testConfigs) {
        try {
            console.log(`Testing ${config.name}...`);
            
            const pool = new Pool({
                connectionString: config.url,
                ssl: { rejectUnauthorized: false },
                max: 1,
                idleTimeoutMillis: 3000,
                connectionTimeoutMillis: 8000,
            });

            // اختبار أساسي
            const timeResult = await pool.query('SELECT NOW() as current_time');
            
            // اختبار أعمق - محاولة الوصول لجدول
            let tableTest = null;
            try {
                const tableResult = await pool.query('SELECT COUNT(*) as count FROM employees');
                tableTest = `✅ Found ${tableResult.rows[0].count} employees`;
            } catch (tableError) {
                tableTest = `❌ Table test failed: ${tableError.message}`;
            }

            await pool.end();

            results.push({
                name: config.name,
                status: '✅ SUCCESS',
                time: timeResult.rows[0].current_time,
                tableTest: tableTest,
                url: config.url.replace(/:([^:@]+)@/, ':****@')
            });

            // إذا نجح، أرجع النتيجة فوراً
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: `🎉 ${config.name} works perfectly!`,
                    workingConfig: {
                        name: config.name,
                        url: config.url,
                        maskedUrl: config.url.replace(/:([^:@]+)@/, ':****@')
                    },
                    testResults: results,
                    instruction: `Use this URL in Netlify Environment Variables: ${config.url}`
                })
            };

        } catch (error) {
            results.push({
                name: config.name,
                status: '❌ FAILED',
                error: error.message,
                code: error.code,
                detail: error.detail,
                url: config.url.replace(/:([^:@]+)@/, ':****@')
            });
        }
    }

    // إذا فشلت جميع المحاولات
    return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
            success: false,
            message: '❌ All authentication attempts failed',
            testResults: results,
            currentDatabaseUrl: process.env.DATABASE_URL ? 
                process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@') : 'Not set',
            solutions: [
                '1. Reset your database password in Supabase Settings → Database',
                '2. Enable Connection Pooling in Supabase',
                '3. Use the working URL from successful test above',
                '4. Make sure your Supabase project is not paused',
                '5. Check if you need to whitelist Netlify IPs'
            ]
        })
    };
};
