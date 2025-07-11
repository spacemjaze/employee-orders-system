// netlify/functions/admin-dashboard.js
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.path;
    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};

    // Routes handling
    if (path.includes('/stats')) {
      return await handleStats(method, queryParams);
    } else if (path.includes('/orders')) {
      return await handleOrders(method, event);
    } else if (path.includes('/messengers')) {
      return await handleMessengers(method, event);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'المسار غير موجود' })
    };

  } catch (error) {
    console.error('خطأ في الخادم:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'خطأ داخلي في الخادم', 
        details: error.message 
      })
    };
  }
};

// معالج الإحصائيات
async function handleStats(method, queryParams) {
  if (method !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'الطريقة غير مدعومة' })
    };
  }

  // محاكاة بيانات الإحصائيات
  const stats = {
    dashboard: {
      totalOrders: 156,
      completedOrders: 142,
      pendingOrders: 8,
      cancelledOrders: 6,
      totalRevenue: 12750000,
      averageDeliveryTime: 38, // minutes
      activeMessengers: 12,
      customerSatisfaction: 4.7,
      todayOrders: 23,
      thisWeekOrders: 98,
      thisMonthOrders: 423
    },
    revenueByDay: [
      { date: '2024-01-10', revenue: 850000 },
      { date: '2024-01-11', revenue: 920000 },
      { date: '2024-01-12', revenue: 780000 },
      { date: '2024-01-13', revenue: 1100000 },
      { date: '2024-01-14', revenue: 950000 },
      { date: '2024-01-15', revenue: 1250000 }
    ],
    ordersByStatus: [
      { status: 'completed', count: 142, percentage: 91.0 },
      { status: 'pending', count: 8, percentage: 5.1 },
      { status: 'cancelled', count: 6, percentage: 3.9 }
    ],
    topMessengers: [
      { id: 'MSG-001', name: 'أحمد محمد', ordersCompleted: 45, rating: 4.8 },
      { id: 'MSG-002', name: 'محمد علي', ordersCompleted: 38, rating: 4.6 },
      { id: 'MSG-003', name: 'علي حسن', ordersCompleted: 32, rating: 4.2 }
    ],
    deliveryTimeDistribution: [
      { range: '0-30 دقيقة', count: 85, percentage: 59.9 },
      { range: '30-60 دقيقة', count: 42, percentage: 29.6 },
      { range: '60+ دقيقة', count: 15, percentage: 10.5 }
    ]
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stats)
  };
}

// معالج الطلبات
async function handleOrders(method, event) {
  const headers = { 'Content-Type': 'application/json' };
  
  switch (method) {
    case 'GET':
      return await getOrders(event.queryStringParameters);
    case 'POST':
      return await createOrder(JSON.parse(event.body || '{}'));
    case 'PUT':
      return await updateOrder(event.pathParameters?.id, JSON.parse(event.body || '{}'));
    case 'DELETE':
      return await deleteOrder(event.pathParameters?.id);
    default:
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'الطريقة غير مدعومة' })
      };
  }
}

// جلب الطلبات مع الفلترة والترقيم
async function getOrders(queryParams = {}) {
  // محاكاة بيانات الطلبات
  const allOrders = [
    {
      id: 'ORD-001',
      messenger: {
        id: 'MSG-001',
        name: 'أحمد محمد',
        phone: '+964 7901234567',
        rating: 4.8
      },
      customer: {
        name: 'سارة أحمد',
        phone: '+964 7901234567',
        address: 'شارع الكرادة، بغداد'
      },
      location: {
        coordinates: { lat: 33.3128, lng: 44.3736 },
        address: 'شارع الكرادة، بغداد',
        district: 'الكرادة',
        city: 'بغداد'
      },
      orderDetails: {
        orderDate: '2024-01-15T10:30:00Z',
        completedDate: '2024-01-15T11:45:00Z',
        status: 'completed',
        priority: 'normal'
      },
      timing: {
        totalDuration: 75,
        stages: [
          { stage: 'created', time: '2024-01-15T10:30:00Z', completed: true },
          { stage: 'assigned', time: '2024-01-15T10:35:00Z', completed: true },
          { stage: 'picked_up', time: '2024-01-15T10:50:00Z', completed: true },
          { stage: 'in_transit', time: '2024-01-15T11:00:00Z', completed: true },
          { stage: 'delivered', time: '2024-01-15T11:45:00Z', completed: true }
        ]
      },
      items: [
        { name: 'هاتف ذكي', quantity: 1, price: 750000 },
        { name: 'سماعات لاسلكية', quantity: 1, price: 100000 }
      ],
      financial: {
        subtotal: 850000,
        deliveryFee: 15000,
        total: 865000,
        paymentMethod: 'cash',
        paymentStatus: 'paid'
      },
      images: [
        {
          type: 'pickup',
          url: 'https://via.placeholder.com/300x200/48bb78/ffffff?text=تم+الاستلام',
          timestamp: '2024-01-15T10:50:00Z'
        },
        {
          type: 'delivery',
          url: 'https://via.placeholder.com/300x200/48bb78/ffffff?text=تم+التسليم',
          timestamp: '2024-01-15T11:45:00Z'
        }
      ],
      notes: 'تم التسليم بنجاح للعميل',
      feedback: {
        customerRating: 5,
        customerComment: 'خدمة ممتازة وسريعة'
      }
    },
    // يمكن إضافة المزيد من الطلبات هنا...
  ];

  // تطبيق الفلاتر
  let filteredOrders = allOrders;

  if (queryParams.status) {
    filteredOrders = filteredOrders.filter(o => o.orderDetails.status === queryParams.status);
  }

  if (queryParams.messenger) {
    filteredOrders = filteredOrders.filter(o => o.messenger.id === queryParams.messenger);
  }

  if (queryParams.dateFrom) {
    const fromDate = new Date(queryParams.dateFrom);
    filteredOrders = filteredOrders.filter(o => new Date(o.orderDetails.orderDate) >= fromDate);
  }

  if (queryParams.dateTo) {
    const toDate = new Date(queryParams.dateTo);
    filteredOrders = filteredOrders.filter(o => new Date(o.orderDetails.orderDate) <= toDate);
  }

  if (queryParams.search) {
    const searchTerm = queryParams.search.toLowerCase();
    filteredOrders = filteredOrders.filter(o => 
      o.id.toLowerCase().includes(searchTerm) ||
      o.messenger.name.toLowerCase().includes(searchTerm) ||
      o.customer.name.toLowerCase().includes(searchTerm)
    );
  }

  // ترقيم الصفحات
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orders: paginatedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredOrders.length / limit),
        totalOrders: filteredOrders.length,
        hasNext: endIndex < filteredOrders.length,
        hasPrev: startIndex > 0
      }
    })
  };
}

// إنشاء طلب جديد
async function createOrder(orderData) {
  try {
    // التحقق من صحة البيانات
    if (!orderData.customer || !orderData.items || !orderData.location) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'بيانات الطلب غير مكتملة' })
      };
    }

    // إنشاء طلب جديد
    const newOrder = {
      id: generateOrderId(),
      messenger: null, // سيتم تعيين المراسل لاحقاً
      customer: orderData.customer,
      location: orderData.location,
      orderDetails: {
        orderDate: new Date().toISOString(),
        completedDate: null,
        status: 'pending',
        priority: orderData.priority || 'normal'
      },
      timing: {
        totalDuration: 0,
        stages: [
          { stage: 'created', time: new Date().toISOString(), completed: true },
          { stage: 'assigned', time: null, completed: false },
          { stage: 'picked_up', time: null, completed: false },
          { stage: 'in_transit', time: null, completed: false },
          { stage: 'delivered', time: null, completed: false }
        ]
      },
      items: orderData.items,
      financial: {
        subtotal: orderData.financial.subtotal,
        deliveryFee: orderData.financial.deliveryFee || 15000,
        total: orderData.financial.subtotal + (orderData.financial.deliveryFee || 15000),
        paymentMethod: orderData.financial.paymentMethod || 'cash',
        paymentStatus: 'pending'
      },
      images: [],
      notes: orderData.notes || '',
      feedback: null
    };

    // هنا يمكن حفظ الطلب في قاعدة البيانات
    // await saveOrderToDatabase(newOrder);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'تم إنشاء الطلب بنجاح',
        order: newOrder
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'خطأ في إنشاء الطلب', details: error.message })
    };
  }
}

// تحديث الطلب
async function updateOrder(orderId, updateData) {
  try {
    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'رقم الطلب مطلوب' })
      };
    }

    // هنا يمكن تحديث الطلب في قاعدة البيانات
    // const updatedOrder = await updateOrderInDatabase(orderId, updateData);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'تم تحديث الطلب بنجاح',
        orderId: orderId,
        updates: updateData
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'خطأ في تحديث الطلب', details: error.message })
    };
  }
}

// حذف الطلب
async function deleteOrder(orderId) {
  try {
    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'رقم الطلب مطلوب' })
      };
    }

    // هنا يمكن حذف الطلب من قاعدة البيانات
    // await deleteOrderFromDatabase(orderId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'تم حذف الطلب بنجاح',
        orderId: orderId
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'خطأ في حذف الطلب', details: error.message })
    };
  }
}

// معالج المراسلين
async function handleMessengers(method, event) {
  const headers = { 'Content-Type': 'application/json' };
  
  switch (method) {
    case 'GET':
      return await getMessengers(event.queryStringParameters);
    case 'POST':
      return await createMessenger(JSON.parse(event.body || '{}'));
    case 'PUT':
      return await updateMessenger(event.pathParameters?.id, JSON.parse(event.body || '{}'));
    default:
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'الطريقة غير مدعومة' })
      };
  }
}

// جلب بيانات المراسلين
async function getMessengers(queryParams = {}) {
  const messengers = [
    {
      id: 'MSG-001',
      name: 'أحمد محمد',
      phone: '+964 7901234567',
      email: 'ahmed@example.com',
      status: 'active',
      location: { lat: 33.3128, lng: 44.3736 },
      rating: 4.8,
      totalOrders: 156,
      completedOrders: 148,
      cancelledOrders: 5,
      vehicle: {
        type: 'motorcycle',
        plate: 'بغداد 12345',
        model: 'هوندا 2022'
      },
      workingHours: {
        start: '08:00',
        end: '20:00',
        days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      todayStats: {
        ordersCompleted: 8,
        ordersInProgress: 1,
        totalEarnings: 185000,
        hoursWorked: 6.5
      }
    },
    // المزيد من المراسلين...
  ];

  // تطبيق الفلاتر
  let filteredMessengers = messengers;

  if (queryParams.status) {
    filteredMessengers = filteredMessengers.filter(m => m.status === queryParams.status);
  }

  if (queryParams.search) {
    const searchTerm = queryParams.search.toLowerCase();
    filteredMessengers = filteredMessengers.filter(m => 
      m.name.toLowerCase().includes(searchTerm) ||
      m.phone.includes(searchTerm)
    );
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filteredMessengers)
  };
}

// إنشاء مراسل جديد
async function createMessenger(messengerData) {
  try {
    const newMessenger = {
      id: generateMessengerId(),
      ...messengerData,
      status: 'active',
      rating: 0,
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      createdAt: new Date().toISOString()
    };

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'تم إنشاء حساب المراسل بنجاح',
        messenger: newMessenger
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'خطأ في إنشاء حساب المراسل', details: error.message })
    };
  }
}

// تحديث بيانات المراسل
async function updateMessenger(messengerId, updateData) {
  try {
    if (!messengerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'رقم المراسل مطلوب' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'تم تحديث بيانات المراسل بنجاح',
        messengerId: messengerId,
        updates: updateData
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'خطأ في تحديث بيانات المراسل', details: error.message })
    };
  }
}

// دوال مساعدة
function generateOrderId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp.slice(-6)}${random.toUpperCase()}`;
}

function generateMessengerId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 3);
  return `MSG-${timestamp.slice(-6)}${random.toUpperCase()}`;
}
