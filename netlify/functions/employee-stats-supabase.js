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

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
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

        const { employeeId } = event.queryStringParameters || {};
        
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

        console.log('جلب إحصائيات الموظف:', employeeId);

        // إنشاء Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        const today = new Date().toISOString().split('T')[0];

        // إحصائيات اليوم
        const { data: todayStats, error: todayError } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', today)
            .single();

        if (todayError && todayError.code !== 'PGRST116') {
            console.log('خطأ في جلب إحصائيات اليوم:', todayError);
        }

        // إحصائيات عامة
        const { data: allOrders, error: ordersError } = await supabase
            .from('orders')
            .select('status')
            .eq('employee_id', employeeId);

        if (ordersError) {
            console.error('خطأ في جلب الأوردرات:', ordersError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'خطأ في جلب الإحصائيات: ' + ordersError.message 
                })
            };
        }

        // حساب الإحصائيات العامة
        const totalOrders = allOrders.length;
        const completedOrders = allOrders.filter(order => order.status === 'مكتمل').length;
        const incompleteOrders = allOrders.filter(order => order.status === 'غير مكتمل').length;

        // آخر 5 أوردرات
        const { data: recentOrders, error: recentError } = await supabase
            .from('orders')
            .select(`
                order_type,
                order_details,
                status,
                created_at,
                sender_name
            `)
            .eq('employee_id', employeeId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) {
            console.error('خطأ في جلب الأوردرات الأخيرة:', recentError);
        }

        // تنسيق التواريخ
        const formattedRecentOrders = (recentOrders || []).map(order => ({
            ...order,
            formatted_date: new Date(order.created_at).toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
        }));

        console.log('تم جلب الإحصائيات بنجاح');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                todayStats: todayStats || { 
                    total_orders: 0, 
                    completed_orders: 0, 
                    incomplete_orders: 0 
                },
                totalStats: {
                    total_orders: totalOrders,
                    completed_orders: completedOrders,
                    incomplete_orders: incompleteOrders
                },
                recentOrders: formattedRecentOrders
            })
        };

    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'خطأ في جلب الإحصائيات: ' + error.message 
            })
        };
    }
};
