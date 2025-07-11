exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const employeeId = event.queryStringParameters?.employeeId;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        todayStats: {
          total_orders: 5
        },
        recentOrders: [
          {
            order_type: 'استطلاع',
            order_details: 'استطلاع رأي حول الخدمات المحلية',
            created_at: new Date().toISOString()
          }
        ]
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'خطأ في جلب الإحصائيات'
      })
    };
  }
};
