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

    const testConnections = [
        // Connection pooling URLs
        'postgresql://postgres.hemfegaipidqqojuasdc:sHhS7r8LwXPlSXO@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
        'postgresql://postgres.hemfegaipidqqojuasdc:sHhS7r8LwXPlSXO@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
        'postgresql://postgres.hemfegaipidqqojuasdc:sHhS7r8LwXPlSXO@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
        // Direct connection
        'postgresql://postgres:sHhS7r8LwXPlSXO@db.hemfegaipidqqojuasdc.supabase.co:5432/postgres'
    ];

    const results = [];

    // اختبار الـ DATABASE_URL المحدد في Environment Variables
    if (process.env.DATABASE_URL) {
        console.log('Testing configured DATABASE_URL...');
        try {
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false },
                max: 1,
                idleTimeoutMillis: 3000,
                connectionTimeoutMillis: 5000,
            });

            const result = await pool.query('SELECT NOW() as time');
            await pool.end();

            results.push({
                url: process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'),
                status: 'SUCCESS',
                message: 'Current DATABASE_URL works!',
                time: result.rows[0].time
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: '✅ Current DATABASE_URL is working perfectly!',
                    currentUrl: process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'),
                    testTime: result.rows[0].time
                })
            };

        } catch (error) {
            results.push({
                url: process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'),
                status: 'FAILED',
                error: error.message,
                code: error.code
            });
        }
    }

    // اختبار URLs بديلة
    console.log('Testing alternative connection strings...');
    
    for (const testUrl of testConnections) {
        try {
            console.log(`Testing: ${testUrl.replace(/:([^:@]+)@/, ':****@')}`);
            
            const pool = new Pool({
                connectionString: testUrl,
                ssl: { rejectUnauthorized: false },
                max: 1,
                idleTimeoutMillis: 3000,
                connectionTimeoutMillis: 5000,
            });

            const result = await pool.query('SELECT NOW() as time, version() as version');
            await pool.end();

            results.push({
                url: testUrl.replace(/:([^:@]+)@/, ':****@'),
                status: 'SUCCESS',
                message: 'Connection successful!',
                time: result.rows[0].time,
                version: result.rows[0].version.substring(0, 50) + '...'
            });

            // إذا نجح أي اتصال، أرجع النتيجة فوراً
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: '🎉 Found working connection!',
                    workingUrl: testUrl.replace(/:([^:@]+)@/, ':****@'),
                    recommendation: `Use this URL in your Netlify environment variables: ${testUrl}`,
                    testResults: results
                })
            };

        } catch (error) {
            results.push({
                url: testUrl.replace(/:([^:@]+)@/, ':****@'),
                status: 'FAILED',
                error: error.message,
                code: error.code
            });
        }
    }

    // إذا فشلت جميع المحاولات
    return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
            success: false,
            message: '❌ All connection attempts failed',
            currentDatabaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
            testResults: results,
            suggestions: [
                '1. Check your Supabase project settings',
                '2. Verify the project ID is correct: hemfegaipidqqojuasdc',
                '3. Confirm the password is correct: sHhS7r8LwXPlSXO',
                '4. Try enabling connection pooling in Supabase settings',
                '5. Check if your Supabase project is paused or suspended'
            ]
        })
    };
};
