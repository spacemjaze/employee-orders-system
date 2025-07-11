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

        const { employeeId, limit = 10, offset = 0 } = event.queryStringParameters || {};
        
        console.log('جلب الأوردرات، الموظف:', employeeId, 'الحد:', limit, 'الإزاحة:', offset);

        // إنشاء Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        let query = supabase
            .from('orders')
            .select(`
                *,
                employees:employee_id (
                    name,
                    employee_id
                )
            `)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        // إضافة فلتر الموظف إذا تم تحديده
        if (employeeId) {
            query = query.eq('employee_id', employeeId);
        }

        const { data: orders, error } = await query;

        if (error) {
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

        // تنسيق البيانات
        const formattedOrders = orders.map(order => ({
            ...order,
            employee_name: order.employees?.name || 'غير معروف',
            emp_id: order.employees?.employee_id || 'غير معروف',
            formatted_date: new Date(order.created_at).toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
        }));

        console.log('تم جلب', formattedOrders.length, 'أوردر بنجاح');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                orders: formattedOrders,
                total: formattedOrders.length,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: formattedOrders.length === parseInt(limit)
                }
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
