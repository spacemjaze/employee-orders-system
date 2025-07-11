exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const orderData = JSON.parse(event.body);
    
    // هنا يمكنك حفظ البيانات في قاعدة البيانات
    console.log('تم استلام الطلب:', orderData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'تم حفظ الطلب بنجاح',
        orderId: Date.now()
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'خطأ في حفظ الطلب'
      })
    };
  }
};
