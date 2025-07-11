// netlify/functions/login-supabase.js
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, password, userType } = JSON.parse(event.body);

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'البريد الإلكتروني وكلمة المرور مطلوبان'
                })
            };
        }

        // تسجيل الدخول عبر Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('Auth error:', authError);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: 'بيانات الدخول غير صحيحة'
                })
            };
        }

        // التحقق من نوع المستخدم
        let userData = null;
        if (userType === 'admin') {
            // للإداريين - يمكن إضافة جدول admins منفصل
            userData = {
                id: authData.user.id,
                email: authData.user.email,
                role: 'admin',
                name: authData.user.user_metadata?.name || 'إداري'
            };
        } else {
            // للمراسلين - البحث في جدول employees
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();

            if (employeeError || !employeeData) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        error: 'المستخدم غير مسجل أو غير مفعل'
                    })
                };
            }

            userData = {
                id: employeeData.id,
                email: employeeData.email,
                name: employeeData.name,
                department: employeeData.department,
                position: employeeData.position,
                role: 'employee'
            };
        }

        // إنشاء JWT token
        const token = jwt.sign(
            {
                userId: userData.id,
                email: userData.email,
                role: userData.role,
                name: userData.name
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'تم تسجيل الدخول بنجاح',
                data: {
                    token,
                    user: userData,
                    expiresIn: '24h'
                }
            })
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'خطأ في الخادم',
                message: error.message
            })
        };
    }
};
