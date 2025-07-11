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

        console.log('جلب بيانات لوحة تحكم المدير...');

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 1. إحصائيات عامة
        const { data: totalStats, error: totalError } = await supabase
            .from('orders')
            .select('status, created_at');

        if (totalError) {
            console.log('خطأ في جلب الإحصائيات العامة:', totalError);
        }

        const totalOrders = totalStats?.length || 0;
        const completedOrders = totalStats?.filter(o => o.status === 'مكتمل').length || 0;
        const incompleteOrders = totalStats?.filter(o => o.status === 'غير مكتمل').length || 0;
        const todayOrders = totalStats?.filter(o => o.created_at?.startsWith(today)).length || 0;
        const yesterdayOrders = totalStats?.filter(o => o.created_at?.startsWith(yesterday)).length || 0;

        // 2. إحصائيات الموظفين النشطين اليوم
        const { data: todayStatsPerEmployee, error: statsError } = await supabase
            .from('daily_stats')
            .select(`
                *,
                employees:employee_id (name, employee_id)
            `)
            .eq('date', today);

        if (statsError) {
            console.log('خطأ في جلب إحصائيات الموظفين:', statsError);
        }

        // 3. جلسات تسجيل الدخول اليوم
        const { data: todaySessions, error: sessionsError } = await supabase
            .from('login_sessions')
            .select(`
                *,
                employees:employee_id (name, employee_id)
            `)
            .gte('login_time', today + 'T00:00:00')
            .order('login_time', { ascending: false });

        if (sessionsError) {
            console.log('خطأ في جلب جلسات تسجيل الدخول:', sessionsError);
        }

        // 4. آخر 20 أوردر من جميع الموظفين
        const { data: recentOrders, error: recentError } = await supabase
            .from('orders')
            .select(`
                *,
                employees:employee_id (name, employee_id)
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        if (recentError) {
            console.log('خطأ في جلب الأوردرات الأخيرة:', recentError);
        }

        // 5. الأوردرات المكتملة اليوم بالتفصيل
        const { data: todayOrdersDetail, error: todayOrdersError } = await supabase
            .from('orders')
            .select(`
                *,
                employees:employee_id (name, employee_id)
            `)
            .gte('created_at', today + 'T00:00:00')
            .order('created_at', { ascending: false });

        if (todayOrdersError) {
            console.log('خطأ في جلب أوردرات اليوم:', todayOrdersError);
        }

        // تنسيق البيانات
        const formattedRecentOrders = (recentOrders || []).map(order => ({
            ...order,
            employee_name: order.employees?.name || 'غير معروف',
            employee_id: order.employees?.employee_id || 'غير معروف',
            formatted_date: new Date(order.created_at).toLocaleString('ar-SA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            time_ago: getTimeAgo(order.created_at)
        }));

        const formattedTodayOrders = (todayOrdersDetail || []).map(order => ({
            ...order,
            employee_name: order.employees?.name || 'غير معروف',
            employee_id: order.employees?.employee_id || 'غير معروف',
            formatted_date: new Date(order.created_at).toLocaleString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
        }));

        const employeeStats = (todayStatsPerEmployee || []).map(stat => ({
            ...stat,
            employee_name: stat.employees?.name || 'غير معروف',
            employee_code: stat.employees?.employee_id || 'غير معروف'
        }));

        const activeSessions = (todaySessions || []).map(session => ({
            ...session,
            employee_name: session.employees?.name || 'غير معروف',
            employee_code: session.employees?.employee_id || 'غير معروف',
            login_time_formatted: new Date(session.login_time).toLocaleString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            duration: session.logout_time ? 
                Math.round(session.session_duration_minutes) + ' دقيقة' : 
                'جلسة نشطة'
        }));

        console.log('تم جلب بيانات لوحة التحكم بنجاح');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                summary: {
                    totalOrders,
                    completedOrders,
                    incompleteOrders,
                    todayOrders,
                    yesterdayOrders,
                    totalEmployees: 6, // عدد الموظفين المعروف
                    activeEmployeesToday: employeeStats.length,
                    completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
                },
                todayStats: employeeStats,
                recentOrders: formattedRecentOrders,
                todayOrders: formattedTodayOrders,
                activeSessions: activeSessions
            })
        };

    } catch (error) {
        console.error('خطأ في جلب بيانات لوحة التحكم:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'خطأ في جلب البيانات: ' + error.message 
            })
        };
    }
};

// دالة مساعدة لحساب الوقت المنقضي
function getTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `${diffMins} دقيقة`;
    if (diffHours < 24) return `${diffHours} ساعة`;
    return `${diffDays} يوم`;
}
