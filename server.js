const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// الاتصال بـ Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// تجربة التشغيل
app.get('/', (req, res) => {
    res.send('🚀 سيرفر FreeNet STORE شغال بنجاح على السحاب!');
});

// 1. تسجيل الدخول
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .eq('password', password)
        .single();

    if (error || !user) {
        return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }
    res.json({ success: true, user });
});

// 2. جلب أرقام الأونر
app.get('/api/admin/owners', async (req, res) => {
    const { data: owners, error } = await supabase
        .from('users')
        .select('*')
        .or('role.eq.owner,is_owner.eq.true');

    if (error) return res.status(500).json({ error: error.message });
    res.json(owners);
});

// 3. إشعارات التجديد (28 يوم)
app.get('/api/admin/renewal-alerts', async (req, res) => {
    const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*, users(name, phone, role)');

    if (error) return res.status(500).json({ error: error.message });

    const today = new Date();
    const alerts = subscriptions.filter(sub => {
        const renewalDate = new Date(sub.next_renewal_date);
        const diffDays = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
    });

    res.json(alerts);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

