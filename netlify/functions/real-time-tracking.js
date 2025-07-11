// netlify/functions/real-time-tracking.js
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const method = event.httpMethod;
    const path = event.path;

    if (path.includes('/messengers/locations')) {
      return await handleMessengerLocations(method, event);
    } else if (path.includes('/messengers/routes')) {
      return await handleMessengerRoutes(method, event);
    } else if (path.includes('/messengers/status')) {
      return await handleMessengerStatus(method, event);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'المسار غير موجود' })
    };

  } catch (error) {
    console.error('خطأ في تتبع المراسلين:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'خطأ داخلي في الخادم', details: error.message })
    };
  }
};

// معالج مواقع المراسلين
async function handleMessengerLocations(method, event) {
  const headers = { 'Content-Type': 'application/json' };

  if (method === 'GET') {
    return await getMessengerLocations(event.queryStringParameters);
  } else if (method === 'POST') {
    return await updateMessengerLocation(JSON.parse(event.body || '{}'));
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'الطريقة غير مدعومة' })
  };
}

// جلب مواقع المراسلين الحالية
async function getMessengerLocations(queryParams = {}) {
  // محاكاة بيانات المواقع في الوقت الفعلي
  const messengerLocations = [
    {
      messengerId: 'MSG-001',
      messengerName: 'أحمد محمد',
      currentLocation: { 
        lat: 33.3128 + (Math.random() - 0.5) * 0.01, 
        lng: 44.3736 + (Math.random() - 0.5) * 0.01 
      },
      lastUpdate: new Date().toISOString(),
      status: 'delivering',
      speed: Math.floor(Math.random() * 60) + 20, // km/h
      heading: Math.floor(Math.random() * 360), // degrees
      accuracy: Math.floor(Math.random() * 20) + 5, // meters
      currentOrderId: 'ORD-001',
      estimatedArrival: new Date(Date.now() + 25 * 60000).toISOString(), // 25 minutes
      distanceToDestination: Math.floor(Math.random() * 5000) + 500, // meters
      route: [
        { 
          lat: 33.3128, 
          lng: 44.3736, 
          timestamp: new Date(Date.now() - 600000).toISOString() 
        },
        { 
          lat: 33.3100, 
          lng: 44.3700, 
          timestamp: new Date(Date.now() - 300000).toISOString() 
        },
        { 
          lat: 33.3080, 
          lng: 44.3680, 
          timestamp: new Date().toISOString() 
        }
      ],
      battery: Math.floor(Math.random() * 50) + 50, // battery percentage
      networkSignal: Math.floor(Math.random() * 3) + 2 // signal strength 1-5
    },
    {
      messengerId: 'MSG-002',
      messengerName: 'محمد علي',
      currentLocation: { 
        lat: 33.2778 + (Math.random() - 0.5) * 0.01, 
        lng: 44.2306 + (Math.random() - 0.5) * 0.01 
      },
      lastUpdate: new Date().toISOString(),
      status: 'available',
      speed: 0,
      heading: 0,
      accuracy: 8,
      currentOrderId: null,
      estimatedArrival: null,
      distanceToDestination: 0,
      route: [],
      battery: 85,
      networkSignal: 4
    },
    {
      messengerId: 'MSG-003',
      messengerName: 'علي حسن',
      currentLocation: { 
        lat: 33.2619 + (Math.random() - 0.5) * 0.01, 
        lng: 44.3742 + (Math.random() - 0.5) * 0.01 
      },
      lastUpdate: new Date().toISOString(),
      status: 'busy',
      speed: Math.floor(Math.random() * 40) + 15,
      heading: Math.floor(Math.random() * 360),
      accuracy: 12,
      currentOrderId: 'ORD-003',
      estimatedArrival: new Date(Date.now() + 18 * 60000).toISOString(),
      distanceToDestination: Math.floor(Math.random() * 3000) + 800,
      route: [
        { 
          lat: 33.2619, 
          lng: 44.3742, 
          timestamp: new Date(Date.now() - 400000).toISOString() 
        },
        { 
          lat: 33.2650, 
          lng: 44.3720, 
          timestamp: new Date().toISOString() 
        }
      ],
      battery: 65,
      networkSignal: 3
    }
  ];

  // فلترة حسب المعايير المطلوبة
  let filteredLocations = messengerLocations;

  if (queryParams.status) {
    filteredLocations = filteredLocations.filter(loc => loc.status === queryParams.status);
  }

  if (queryParams.messengerId) {
    filteredLocations = filteredLocations.filter(loc => loc.messengerId === queryParams.messengerId);
  }

  // إضافة بيانات إضافية للتحليل
  const analyticsData = {
    totalActiveMessengers: messengerLocations.filter(m => m.status !== 'offline').length,
    averageSpeed: Math.round(
      messengerLocations
        .filter(m => m.speed > 0)
        .reduce((sum, m) => sum + m.speed, 0) / 
      messengerLocations.filter(m => m.speed > 0).length || 0
    ),
    messengersByStatus: {
      available: messengerLocations.filter(m => m.status === 'available').length,
      busy: messengerLocations.filter(m => m.status === 'busy').length,
      delivering: messengerLocations.filter(m => m.status === 'delivering').length,
      offline: messengerLocations.filter(m => m.status === 'offline').length
    },
    lastUpdateTime: new Date().toISOString()
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messengers: filteredLocations,
      analytics: analyticsData,
      timestamp: new Date().toISOString()
    })
  };
}

// تحديث موقع مراسل
async function updateMessengerLocation(locationData) {
  try {
    const { messengerId, location, status, speed, heading, accuracy, battery } = locationData;

    if (!messengerId || !location || !location.lat || !location.lng) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'بيانات الموقع غير مكتملة' })
      };
    }

    // التحقق من صحة الإحداثيات
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'الإحداثيات غير صحيحة' })
      };
    }

    // إنشاء سجل الموقع الجديد
    const locationRecord = {
      messengerId,
      location,
      timestamp: new Date().toISOString(),
      status: status || 'unknown',
      speed: speed || 0,
      heading: heading || 0,
      accuracy: accuracy || 10,
      battery: battery || 100
    };

    // هنا يمكن حفظ البيانات في قاعدة البيانات
    // await saveLocationToDatabase(locationRecord);

    // تحديث ذاكرة التخزين المؤقت للمواقع
    // await updateLocationCache(messengerId, locationRecord);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'تم تحديث الموقع بنجاح',
        messengerId,
        location: locationRecord,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'خطأ في تحديث الموقع', details: error.message })
    };
  }
}

// معالج مسارات المراسلين
async function handleMessengerRoutes(method, event) {
  if (method !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'الطريقة غير مدعومة' })
    };
  }

  const queryParams = event.queryStringParameters || {};
  const messengerId = queryParams.messengerId;
  const timeRange = queryParams.timeRange || '1h'; // 1h, 6h, 24h

  if (!messengerId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'رقم المراسل مطلوب' })
    };
  }

  // محاكاة بيانات المسار التاريخي
  const now = new Date();
  const timeRangeMs = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  };

  const routeHistory = [];
  const interval = timeRangeMs[timeRange] / 20; // 20 نقطة في المسار

  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - (19 - i) * interval);
    routeHistory.push({
      lat: 33.3128 + (Math.random() - 0.5) * 0.05,
      lng: 44.3736 + (Math.random() - 0.5) * 0.05,
      timestamp: timestamp.toISOString(),
      speed: Math.floor(Math.random() * 60) + 10,
      heading: Math.floor(Math.random() * 360)
    });
  }

  // حساب إحصائيات المسار
  const routeStats = {
    totalDistance: Math.floor(Math.random() * 50000) + 10000, // meters
    averageSpeed: Math.floor(Math.random() * 30) + 25, // km/h
    maxSpeed: Math.floor(Math.random() * 20) + 60, // km/h
    totalTime: timeRangeMs[timeRange] / 1000 / 60, // minutes
    stops: Math.floor(Math.random() * 5) + 2,
    deliveries: Math.floor(Math.random() * 8) + 3
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messengerId,
      timeRange,
      route: routeHistory,
      stats: routeStats,
      timestamp: new Date().toISOString()
    })
  };
}

// معالج حالة المراسلين
async function handleMessengerStatus(method, event) {
  if (method === 'GET') {
    return await getMessengerStatuses();
  } else if (method === 'PUT') {
    return await updateMessengerStatus(JSON.parse(event.body || '{}'));
  }

  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'الطريقة غير مدعومة' })
  };
}

// جلب حالات جميع المراسلين
async function getMessengerStatuses() {
  const statuses = [
    {
      messengerId: 'MSG-001',
      messengerName: 'أحمد محمد',
      status: 'delivering',
      lastSeen: new Date().toISOString(),
      currentOrderId: 'ORD-001',
      workingHours: { start: '08:00', end: '20:00' },
      isOnline: true,
      batteryLevel: 75,
      signalStrength: 4
    },
    {
      messengerId: 'MSG-002',
      messengerName: 'محمد علي',
      status: 'available',
      lastSeen: new Date().toISOString(),
      currentOrderId: null,
      workingHours: { start: '09:00', end: '21:00' },
      isOnline: true,
      batteryLevel: 85,
      signalStrength: 5
    },
    {
      messengerId: 'MSG-003',
      messengerName: 'علي حسن',
      status: 'busy',
      lastSeen: new Date().toISOString(),
      currentOrderId: 'ORD-003',
      workingHours: { start: '07:00', end: '19:00' },
      isOnline: true,
      batteryLevel: 45,
      signalStrength: 3
    }
  ];

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      statuses,
      summary: {
        total: statuses.length,
        online: statuses.filter(s => s.isOnline).length,
        available: statuses.filter(s => s.status === 'available').length,
        busy: statuses.filter(s => s.status === 'busy').length,
        delivering: statuses.filter(s => s.status === 'delivering').length,
        offline: statuses.filter(s => !s.isOnline).length
      },
      timestamp: new Date().toISOString()
    })
  };
}

// تحديث حالة مراسل
async function updateMessengerStatus(statusData) {
  try {
    const { messengerId, status, orderId } = statusData;

    if (!messengerId || !status) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'بيانات الحالة غير مكتملة' })
      };
    }

    // التحقق من صحة الحالة
    const validStatuses = ['available', 'busy', 'delivering', 'offline', 'break'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'حالة غير صحيحة' })
      };
    }

    // تحديث الحالة
    const updatedStatus = {
      messengerId,
      status,
      orderId: orderId || null,
      timestamp: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };

    // هنا يمكن حفظ التحديث في قاعدة البيانات
    // await updateMessengerStatusInDatabase(updatedStatus);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'تم تحديث حالة المراسل بنجاح',
        messengerId,
        status: updatedStatus,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'خطأ في تحديث حالة المراسل', details: error.message })
    };
  }
}
