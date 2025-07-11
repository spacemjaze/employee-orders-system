const { createClient } = require('@supabase/supabase-js');

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
        console.log('Testing Supabase connection...');

        // التحقق من متغيرات البيئة
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '❌ Supabase environment variables not found',
                    debug: {
                        hasUrl: !!process.env.SUPABASE_URL,
                        hasKey: !!process.env.SUPABASE_ANON_KEY,
                        envVars: Object.keys(process.env).filter(key => 
                            key.includes('SUPABASE') || key.includes('DATABASE')
                        )
                    }
                })
            };
        }

        // إنشاء Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        console.log('Supabase client created');

        // اختبار الاتصال الأساسي
        const { data: tables, error: tablesError } = await supabase
            .from('employees')
            .select('count', { count: 'exact', head: true });

        if (tablesError) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '❌ Failed to connect to Supabase',
                    error: tablesError.message,
                    debug: {
                        url: process.env.SUPABASE_URL,
                        keyLength: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0
                    }
                })
            };
        }

        // اختبار جدول الموظفين
        const { data: employees, error: employeesError } = await supabase
            .from('employees')
            .select('id, username, name, role')
            .eq('is_active', true)
            .limit(5);

        if (employeesError) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '❌ Failed to query employees table',
                    error: employeesError.message
                })
            };
        }

        // اختبار باقي الجداول
        const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        const { count: sessionsCount } = await supabase
            .from('login_sessions')
            .select('*', { count: 'exact', head: true });

        const { count: statsCount } = await supabase
            .from('daily_stats')
            .select('*', { count: 'exact', head: true });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '🎉 Supabase connection successful!',
                data: {
                    supabaseUrl: process.env.SUPABASE_URL,
                    employeesCount: employees ? employees.length : 0,
                    ordersCount: ordersCount || 0,
                    sessionsCount: sessionsCount || 0,
                    statsCount: statsCount || 0,
                    employees: employees
                },
                nextSteps: [
                    '1. Try logging in with username: ahmed_thaer, password: ahmed123',
                    '2. All Supabase operations should work now!',
                    '3. The system is ready for use'
                ]
            })
        };

    } catch (error) {
        console.error('❌ Supabase test failed:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: '❌ Supabase test failed',
                error: error.message,
                debug: {
                    hasSupabaseUrl: !!process.env.SUPABASE_URL,
                    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
                }
            })
        };
    }
};
