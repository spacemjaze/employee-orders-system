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

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        console.log('Starting Supabase login process...');

        // التحقق من متغيرات البيئة
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'إعدادات Supabase غير مكتملة' 
                })
            };
        }

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

        // إنشاء Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        console.log('Supabase client created successfully');

        // البحث عن الموظف
        const { data: employees, error } = await supabase
            .from('employees')
            .select('*')
            .eq('username', username)
            .eq('is_active', true);

        if (error) {
            console.error('Supabase query error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'خطأ في البحث عن الموظف: ' + error.message 
                })
            };
        }

        console.log('Query result:', employees ? employees.length : 0, 'employees found');

        if (!employees || employees.length === 0) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'اسم المستخدم غير صحيح' 
                })
            };
        }

        const employee = employees[0];
        console.log('Employee found:', employee.name);

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
            const { error: sessionError } = await supabase
                .from('login_sessions')
                .insert({
                    employee_id: employee.id,
                    ip_address: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown',
                    user_agent: event.headers['user-agent'] || 'unknown'
                });

            if (sessionError) {
                console.log('Session recording failed:', sessionError);
            } else {
                console.log('Login session recorded successfully');
            }
        } catch (sessionError) {
            console.log('Session recording error:', sessionError);
        }

        // الحصول على إحصائيات اليوم
        const today = new Date().toISOString().split('T')[0];
        let todayOrders = 0;

        try {
            const { data: todayStats, error: statsError } = await supabase
                .from('daily_stats')
                .select('total_orders')
                .eq('employee_id', employee.id)
                .eq('date', today)
                .single();

            if (!statsError && todayStats) {
                todayOrders = todayStats.total_orders;
            }
            console.log('Today stats loaded:', todayOrders);
        } catch (statsError) {
            console.log('Stats loading failed:', statsError);
            // نكمل مع القيم الافتراضية
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'تم تسجيل الدخول بنجاح',
                employee: {
                    id: employee.id,
                    name: employee.name,
                    employee_id: employee.employee_id,
                    username: employee.username,
                    role: employee.role,
                    todayOrders: todayOrders,
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
