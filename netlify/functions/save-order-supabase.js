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

        const {
            employeeId,
            orderType,
            orderDetails,
            senderName,
            locationLatitude,
            locationLongitude,
            locationAccuracy,
            photoData,
            status,
            incompleteReason,
            sessionId,
            orderStartTime,
            orderEndTime,
            orderDurationMs
        } = JSON.parse(event.body);

        // التحقق من البيانات المطلوبة
        if (!employeeId || !orderType || !orderDetails || !senderName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'بيانات غير مكتملة' 
                })
            };
        }

        // إنشاء Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // إدراج الأوردر في قاعدة البيانات
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                employee_id: employeeId,
                order_type: orderType,
                order_details: orderDetails,
                sender_name: senderName,
                location_latitude: locationLatitude,
                location_longitude: locationLongitude,
                location_accuracy: locationAccuracy,
                photo_data: photoData,
                status: status || 'مكتمل',
                incomplete_reason: incompleteReason,
                session_id: sessionId,
                order_start_time: orderStartTime,
                order_end_time: orderEndTime,
                order_duration_ms: orderDurationMs
            })
            .select()
            .single();

        if (orderError) {
            console.error('خطأ في إدراج الأوردر:', orderError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'خطأ في حفظ الأوردر: ' + orderError.message 
                })
            };
        }

        // تحديث الإحصائيات اليومية
        const today = new Date().toISOString().split('T')[0];
        
        // التحقق من وجود إحصائيات اليوم
        const { data: existingStats } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', today)
            .single();

        if (existingStats) {
            // تحديث الإحصائيات الموجودة
            await supabase
                .from('daily_stats')
                .update({
                    total_orders: existingStats.total_orders + 1,
                    completed_orders: existingStats.completed_orders + (status === 'مكتمل' ? 1 : 0),
                    incomplete_orders: existingStats.incomplete_orders + (status === 'غير مكتمل' ? 1 : 0),
                    updated_at: new Date().toISOString()
                })
                .eq('employee_id', employeeId)
                .eq('date', today);
        } else {
            // إنشاء إحصائيات جديدة
            await supabase
                .from('daily_stats')
                .insert({
                    employee_id: employeeId,
                    date: today,
                    total_orders: 1,
                    completed_orders: status === 'مكتمل' ? 1 : 0,
                    incomplete_orders: status === 'غير مكتمل' ? 1 : 0
                });
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'تم حفظ الأوردر بنجاح',
                orderId: orderData.id
            })
        };

    } catch (error) {
        console.error('خطأ في حفظ الأوردر:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'خطأ في حفظ الأوردر: ' + error.message 
            })
        };
    }
};
