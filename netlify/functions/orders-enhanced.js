// netlify/functions/orders-enhanced.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { httpMethod, queryStringParameters } = event;

        switch (httpMethod) {
            case 'GET':
                return await getOrders(queryStringParameters);
            case 'POST':
                return await createOrder(JSON.parse(event.body));
            case 'PUT':
                return await updateOrder(JSON.parse(event.body));
            case 'DELETE':
                return await deleteOrder(queryStringParameters);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }

    // جلب الطلبات مع التصفية
    async function getOrders(params) {
        try {
            let query = supabase
                .from('orders')
                .select(`
                    id,
                    employee_name,
                    order_date,
                    video_type,
                    status,
                    location_address,
                    location_lat,
                    location_lng,
                    description,
                    duration,
                    equipment,
                    notes,
                    created_at,
                    updated_at,
                    order_media (
                        id,
                        media_type,
                        file_url,
                        file_name,
                        timestamp,
                        file_size
                    )
                `)
                .order('created_at', { ascending: false });

            // تطبيق التصفية حسب التاريخ
            if (params?.startDate && params?.endDate) {
                query = query
                    .gte('order_date', params.startDate)
                    .lte('order_date', params.endDate);
            }

            // تطبيق التصفية حسب الحالة
            if (params?.status) {
                query = query.eq('status', params.status);
            }

            // تطبيق التصفية حسب نوع الفيديو
            if (params?.videoType) {
                query = query.eq('video_type', params.videoType);
            }

            // تطبيق التصفية حسب اسم المراسل
            if (params?.employeeName) {
                query = query.ilike('employee_name', `%${params.employeeName}%`);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            // تنسيق البيانات للعرض
            const formattedOrders = data.map(order => ({
                id: order.id,
                employeeName: order.employee_name,
                orderDate: order.order_date,
                videoType: order.video_type,
                status: order.status,
                location: {
                    address: order.location_address,
                    coordinates: {
                        lat: order.location_lat,
                        lng: order.location_lng
                    }
                },
                description: order.description,
                duration: order.duration,
                equipment: order.equipment || [],
                notes: order.notes,
                capturedMedia: order.order_media?.map(media => ({
                    id: media.id,
                    type: media.media_type,
                    url: media.file_url,
                    fileName: media.file_name,
                    timestamp: media.timestamp,
                    fileSize: media.file_size
                })) || [],
                createdAt: order.created_at,
                updatedAt: order.updated_at
            }));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: formattedOrders,
                    count: formattedOrders.length
                })
            };

        } catch (error) {
            console.error('Error fetching orders:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'فشل في جلب الطلبات',
                    message: error.message
                })
            };
        }
    }

    // إنشاء طلب جديد
    async function createOrder(orderData) {
        try {
            // التحقق من صحة البيانات
            if (!orderData.employeeName || !orderData.videoType || !orderData.location) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'بيانات غير مكتملة',
                        message: 'يجب توفير اسم المراسل ونوع الفيديو والموقع'
                    })
                };
            }

            // إدراج الطلب الأساسي
            const { data: orderResult, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    employee_name: orderData.employeeName,
                    order_date: orderData.orderDate || new Date().toISOString().split('T')[0],
                    video_type: orderData.videoType,
                    status: orderData.status || 'pending',
                    location_address: orderData.location.address,
                    location_lat: orderData.location.coordinates?.lat,
                    location_lng: orderData.location.coordinates?.lng,
                    description: orderData.description,
                    duration: orderData.duration,
                    equipment: orderData.equipment || [],
                    notes: orderData.notes
                }])
                .select()
                .single();

            if (orderError) {
                throw orderError;
            }

            // إدراج الوسائط المرفقة
            if (orderData.capturedMedia && orderData.capturedMedia.length > 0) {
                const mediaData = orderData.capturedMedia.map(media => ({
                    order_id: orderResult.id,
                    media_type: media.type,
                    file_url: media.url,
                    file_name: media.fileName || `${media.type}_${Date.now()}`,
                    timestamp: media.timestamp || new Date().toISOString(),
                    file_size: media.fileSize
                }));

                const { error: mediaError } = await supabase
                    .from('order_media')
                    .insert(mediaData);

                if (mediaError) {
                    console.error('Error inserting media:', mediaError);
                    // لا نرمي خطأ هنا لأن الطلب تم إنشاؤه بنجاح
                }
            }

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'تم إنشاء الطلب بنجاح',
                    data: { orderId: orderResult.id }
                })
            };

        } catch (error) {
            console.error('Error creating order:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'فشل في إنشاء الطلب',
                    message: error.message
                })
            };
        }
    }

    // تحديث طلب موجود
    async function updateOrder(orderData) {
        try {
            if (!orderData.id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'معرف الطلب مطلوب'
                    })
                };
            }

            const updateData = {};
            
            // تحديث الحقول المرسلة فقط
            if (orderData.employeeName) updateData.employee_name = orderData.employeeName;
            if (orderData.videoType) updateData.video_type = orderData.videoType;
            if (orderData.status) updateData.status = orderData.status;
            if (orderData.location?.address) updateData.location_address = orderData.location.address;
            if (orderData.location?.coordinates?.lat) updateData.location_lat = orderData.location.coordinates.lat;
            if (orderData.location?.coordinates?.lng) updateData.location_lng = orderData.location.coordinates.lng;
            if (orderData.description) updateData.description = orderData.description;
            if (orderData.duration) updateData.duration = orderData.duration;
            if (orderData.equipment) updateData.equipment = orderData.equipment;
            if (orderData.notes) updateData.notes = orderData.notes;

            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderData.id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'تم تحديث الطلب بنجاح',
                    data: data
                })
            };

        } catch (error) {
            console.error('Error updating order:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'فشل في تحديث الطلب',
                    message: error.message
                })
            };
        }
    }

    // حذف طلب
    async function deleteOrder(params) {
        try {
            if (!params?.id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'معرف الطلب مطلوب'
                    })
                };
            }

            // حذف الوسائط المرتبطة أولاً
            await supabase
                .from('order_media')
                .delete()
                .eq('order_id', params.id);

            // حذف الطلب
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', params.id);

            if (error) {
                throw error;
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'تم حذف الطلب بنجاح'
                })
            };

        } catch (error) {
            console.error('Error deleting order:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'فشل في حذف الطلب',
                    message: error.message
                })
            };
        }
    }
};
