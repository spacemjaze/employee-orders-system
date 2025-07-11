// netlify/functions/employee-stats.js
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // التحقق من التفويض
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'غير مصرح بالوصول' })
            };
        }

        const token = authHeader.substring(7);
        let decodedToken;
        
        try {
            decodedToken = jwt.verify(token, jwtSecret);
        } catch (jwtError) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'رمز الوصول غير صالح' })
            };
        }

        const { queryStringParameters } = event;
        const employeeId = queryStringParameters?.employeeId || decodedToken.userId;

        // جلب إحصائيات الموظف
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id,
                status,
                order_date,
                video_type,
                created_at,
                order_media (
                    id,
                    media_type
                )
            `)
            .eq('employee_name', decodedToken.name);

        if (ordersError) {
            throw ordersError;
        }

        // حساب الإحصائيات
        const stats = calculateEmployeeStats(orders);

        // جلب إحصائيات إضافية حسب نوع الفيديو
        const videoTypeStats = await getVideoTypeStats(orders);

        // جلب إحصائيات الأداء الشهري
        const monthlyStats = await getMonthlyStats(orders);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: {
                    employee: {
                        id: decodedToken.userId,
                        name: decodedToken.name,
                        email: decodedToken.email
                    },
                    stats,
                    videoTypeStats,
                    monthlyStats
                }
            })
        };

    } catch (error) {
        console.error('Employee stats error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'خطأ في جلب الإحصائيات',
                message: error.message
            })
        };
    }
};

// حساب الإحصائيات العامة
function calculateEmployeeStats(orders) {
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const inProgress = orders.filter(o => o.status === 'in_progress').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    // طلبات اليوم
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => 
        o.order_date === today
    ).length;

    // طلبات هذا الشهر
    const thisMonth = new Date().toISOString().substring(0, 7);
    const monthOrders = orders.filter(o => 
        o.order_date.startsWith(thisMonth)
    ).length;

    // حساب إجمالي الوسائط
    const totalMedia = orders.reduce((sum, order) => {
        return sum + (order.order_media?.length || 0);
    }, 0);

    // حساب الصور والفيديوهات
    const images = orders.reduce((sum, order) => {
        return sum + (order.order_media?.filter(m => m.media_type === 'image').length || 0);
    }, 0);

    const videos = orders.reduce((sum, order) => {
        return sum + (order.order_media?.filter(m => m.media_type === 'video').length || 0);
    }, 0);

    // حساب معدل الإنجاز
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
        totalOrders: total,
        completedOrders: completed,
        pendingOrders: pending,
        inProgressOrders: inProgress,
        cancelledOrders: cancelled,
        todayOrders,
        monthOrders,
        totalMedia,
        totalImages: images,
        totalVideos: videos,
        completionRate,
        averageOrdersPerMonth: total > 0 ? Math.round(total / getMonthsSinceFirstOrder(orders)) : 0
    };
}

// إحصائيات حسب نوع الفيديو
function getVideoTypeStats(orders) {
    const videoTypes = {};
    
    orders.forEach(order => {
        const type = order.video_type;
        if (!videoTypes[type]) {
            videoTypes[type] = {
                total: 0,
                completed: 0,
                pending: 0,
                mediaCount: 0
            };
        }
        
        videoTypes[type].total++;
        videoTypes[type][order.status]++;
        videoTypes[type].mediaCount += order.order_media?.length || 0;
    });

    return Object.entries(videoTypes).map(([type, stats]) => ({
        videoType: type,
        ...stats,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }));
}

// إحصائيات شهرية
function getMonthlyStats(orders) {
    const monthlyData = {};
    
    orders.forEach(order => {
        const month = order.order_date.substring(0, 7); // YYYY-MM
        
        if (!monthlyData[month]) {
            monthlyData[month] = {
                month,
                total: 0,
                completed: 0,
                pending: 0,
                mediaCount: 0
            };
        }
        
        monthlyData[month].total++;
        monthlyData[month][order.status]++;
        monthlyData[month].mediaCount += order.order_media?.length || 0;
    });

    return Object.values(monthlyData)
        .sort((a, b) => new Date(a.month) - new Date(b.month))
        .slice(-12); // آخر 12 شهر
}

// حساب عدد الشهور منذ أول طلب
function getMonthsSinceFirstOrder(orders) {
    if (orders.length === 0) return 1;
    
    const firstOrderDate = new Date(Math.min(...orders.map(o => new Date(o.created_at))));
    const now = new Date();
    
    const monthsDiff = (now.getFullYear() - firstOrderDate.getFullYear()) * 12 + 
                      (now.getMonth() - firstOrderDate.getMonth());
    
    return Math.max(monthsDiff, 1);
}
