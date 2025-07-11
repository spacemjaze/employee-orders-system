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
        const { data: totalStats } = await supabase
            .from('orders')
            .select('status, created_at');

        const totalOrders = totalStats?.length || 0;
        const completedOrders = totalStats?.filter(o => o.status === 'مكتمل').length || 0;
        const incompleteOrders = totalStats?.filter(o => o.status === 'غير مكتمل').length || 0;
        const todayOrders = totalStats?.filter(o => o.created_at?.startsWith(today)).length || 0;
        const yesterdayOrders = totalStats?.filter(o => o.created_at?.startsWith(yesterday)).length || 0;

        // 2. إحصائيات الموظفين
        const { data: employees } = await supabase
            .from('employees')
            .select('*')
            .eq('is_active', true)
            .order('name');

        // 3. إحصائيات كل موظف اليوم
        const { data: todayStatsPerEmployee } = await supabase
            .from('daily_stats')
            .select(`
                *,
                employees:employee_id (name, employee_id)
            `)
            .eq('date', today);

        // 4. جلسات تسجيل الدخول اليوم
        const { data: todaySessions } = await supabase
            .from('login_sessions')
            .select(`
                *,
                employees:employee_id (name, employee_id)
            `)
            .gte('login_time', today + 'T00:00:00')
            .order('login_time', { ascending: false });

        // 5. آخر 20 أوردر من جميع الموظفين
        const { data: recentOrders } = await supabase
            .from('orders')
            .select(`
                *,
                employees:employee_id (name, employee_id)
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        // 6. الأوردرات المكتملة اليوم بالتفصيل
        const { data: todayOrdersDetail } = await supabase
            .from('orders')
            .select(`
                *,
                employees:employee_id (name, employee_id)
            `)
            .gte('created_at', today + 'T00:00:00')
            .order('created_at', { ascending: false });

        // 7. إحصائيات الأسبوع الماضي
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const { data: weeklyStats } = await supabase
            .from('daily_stats')
            .select(`
                date,
                total_orders,
                completed_orders,
                incomplete_orders,
                employees:employee_id (name)
            `)
            .gte('date', weekAgo)
            .order('date', { ascending: false });

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
                    totalEmployees: employees?.length || 0,
                    activeEmployeesToday: employeeStats.length,
                    completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
                },
                todayStats: employeeStats,
                recentOrders: formattedRecentOrders,
                todayOrders: formattedTodayOrders,
                activeSessions: activeSessions,
                employees: employees || [],
                weeklyTrend: groupByDate(weeklyStats || [])
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

// دالة مساعدة لتجميع البيانات حسب التاريخ
function groupByDate(data) {
    const grouped = {};
    data.forEach(item => {
        const date = item.date;
        if (!grouped[date]) {
            grouped[date] = {
                date,
                total_orders: 0,
                completed_orders: 0,
                incomplete_orders: 0,
                employees: []
            };
        }
        grouped[date].total_orders += item.total_orders || 0;
        grouped[date].completed_orders += item.completed_orders || 0;
        grouped[date].incomplete_orders += item.incomplete_orders || 0;
        if (item.employees?.name) {
            grouped[date].employees.push(item.employees.name);
        }
    });
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
}
