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
    const { username, password } = JSON.parse(event.body);

    // محاكاة تسجيل الدخول - استبدل هذا بقاعدة البيانات الحقيقية
    const employees = {
      'ahmed_thaer': {
        id: 1,
        name: 'أحمد ثائر',
        employee_id: 'EMP001',
        password: '123456',
        lastLogin: new Date().toLocaleString('ar-SA'),
        todayOrders: 5
      }
    };

    const employee = employees[username];
    
    if (!employee || employee.password !== password) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        employee: {
          id: employee.id,
          name: employee.name,
          employee_id: employee.employee_id,
          lastLogin: employee.lastLogin,
          todayOrders: employee.todayOrders
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'خطأ في الخادم'
      })
    };
  }
};
