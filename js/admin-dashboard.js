// js/admin-dashboard.js

class AdminDashboard {
    constructor() {
        this.ordersData = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }

    async loadInitialData() {
        try {
            // محاكاة بيانات من API
            this.ordersData = await this.fetchOrders();
            this.hideLoading();
            this.displayOrders();
            this.updateStatistics();
            this.loadMessengerOptions();
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.showError('فشل في تحميل البيانات');
        }
    }

    async fetchOrders() {
        // محاكاة استدعاء API
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
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
                            address: 'شارع الكرادة، بغداد'
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
                    {
                        id: 'ORD-002',
                        messenger: {
                            id: 'MSG-002',
                            name: 'محمد علي',
                            phone: '+964 7812345678',
                            rating: 4.6
                        },
                        customer: {
                            name: 'عماد حسن',
                            phone: '+964 7812345678',
                            address: 'شارع المنصور، بغداد'
                        },
                        location: {
                            coordinates: { lat: 33.2778, lng: 44.2306 },
                            address: 'شارع المنصور، بغداد'
                        },
                        orderDetails: {
                            orderDate: '2024-01-15T12:00:00Z',
                            completedDate: null,
                            status: 'in_transit',
                            priority: 'high'
                        },
                        timing: {
                            totalDuration: 45,
                            stages: [
                                { stage: 'created', time: '2024-01-15T12:00:00Z', completed: true },
                                { stage: 'assigned', time: '2024-01-15T12:05:00Z', completed: true },
                                { stage: 'picked_up', time: '2024-01-15T12:20:00Z', completed: true },
                                { stage: 'in_transit', time: '2024-01-15T12:30:00Z', completed: true },
                                { stage: 'delivered', time: null, completed: false }
                            ]
                        },
                        items: [
                            { name: 'لابتوب', quantity: 1, price: 1150000 },
                            { name: 'ماوس لاسلكي', quantity: 1, price: 50000 }
                        ],
                        financial: {
                            subtotal: 1200000,
                            deliveryFee: 20000,
                            total: 1220000,
                            paymentMethod: 'card',
                            paymentStatus: 'pending'
                        },
                        images: [
                            {
                                type: 'pickup',
                                url: 'https://via.placeholder.com/300x200/ed8936/ffffff?text=في+الطريق',
                                timestamp: '2024-01-15T12:20:00Z'
                            }
                        ],
                        notes: 'في طريق التسليم - العميل طلب التأكيد قبل الوصول',
                        feedback: null
                    },
                    {
                        id: 'ORD-003',
                        messenger: {
                            id: 'MSG-003',
                            name: 'علي حسن',
                            phone: '+964 7723456789',
                            rating: 4.2
                        },
                        customer: {
                            name: 'فاطمة محمد',
                            phone: '+964 7723456789',
                            address: 'شارع الجادرية، بغداد'
                        },
                        location: {
                            coordinates: { lat: 33.2619, lng: 44.3742 },
                            address: 'شارع الجادرية، بغداد'
                        },
                        orderDetails: {
                            orderDate: '2024-01-15T09:15:00Z',
                            completedDate: null,
                            status: 'cancelled',
                            priority: 'normal'
                        },
                        timing: {
                            totalDuration: 30,
                            stages: [
                                { stage: 'created', time: '2024-01-15T09:15:00Z', completed: true },
                                { stage: 'assigned', time: '2024-01-15T09:20:00Z', completed: true },
                                { stage: 'picked_up', time: null, completed: false },
                                { stage: 'in_transit', time: null, completed: false },
                                { stage: 'delivered', time: null, completed: false }
                            ]
                        },
                        items: [
                            { name: 'تابلت', quantity: 1, price: 400000 },
                            { name: 'كيبورد', quantity: 1, price: 50000 }
                        ],
                        financial: {
                            subtotal: 450000,
                            deliveryFee: 10000,
                            total: 460000,
                            paymentMethod: 'cash',
                            paymentStatus: 'cancelled'
                        },
                        images: [],
                        notes: 'ألغي الطلب بناءً على طلب العميل - عدم توفر العنوان',
                        cancelReason: 'عدم توفر العنوان',
                        feedback: null
                    }
                ]);
            }, 1500);
        });
    }

    setupEventListeners() {
        // البحث
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterOrders();
            });
        }

        // الفلاتر
        const filters = ['statusFilter', 'messengerFilter', 'dateFrom', 'dateTo'];
        filters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.filterOrders();
                });
            }
        });

        // إغلاق المودال عند النقر خارجه
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('orderModal');
            if (event.target === modal) {
                this.closeModal();
            }
        });
    }

    displayOrders() {
        const ordersGrid = document.getElementById('ordersGrid');
        if (!ordersGrid) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedOrders = this.filteredData.slice(startIndex, endIndex);

        ordersGrid.innerHTML = '';

        if (paginatedOrders.length === 0) {
            ordersGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p style="font-size: 1.2rem;">لا توجد طلبات مطابقة للفلاتر المحددة</p>
                </div>
            `;
            return;
        }

        paginatedOrders.forEach(order => {
            const orderCard = this.createOrderCard(order);
            ordersGrid.appendChild(orderCard);
        });

        this.updatePagination();
    }

    createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'order-card';
        
        const statusClass = `status-${order.orderDetails.status}`;
        const statusText = this.getStatusText(order.orderDetails.status);
        const duration = this.formatDuration(order.timing.totalDuration);
        const orderDate = new Date(order.orderDetails.orderDate).toLocaleString('ar-IQ');
        
        card.innerHTML = `
            <div class="order-header">
                <div class="order-id">${order.id}</div>
                <div class="order-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="order-body">
                <div class="order-info">
                    <!-- معلومات المراسل -->
                    <div class="info-section">
                        <div class="info-title">
                            <i class="fas fa-user"></i>
                            معلومات المراسل
                        </div>
                        <div class="info-details">
                            <strong>الاسم:</strong> ${order.messenger.name}<br>
                            <strong>الهاتف:</strong> ${order.messenger.phone}<br>
                            <strong>التقييم:</strong> ${order.messenger.rating} ⭐<br>
                            <strong>المدة:</strong> <span class="duration-indicator">${duration}</span>
                        </div>
                    </div>

                    <!-- معلومات العميل -->
                    <div class="info-section">
                        <div class="info-title">
                            <i class="fas fa-user-circle"></i>
                            معلومات العميل
                        </div>
                        <div class="info-details">
                            <strong>الاسم:</strong> ${order.customer.name}<br>
                            <strong>الهاتف:</strong> ${order.customer.phone}<br>
                            <strong>العنوان:</strong> ${order.location.address}
                        </div>
                    </div>

                    <!-- تفاصيل الطلب -->
                    <div class="info-section">
                        <div class="info-title">
                            <i class="fas fa-shopping-cart"></i>
                            تفاصيل الطلب
                        </div>
                        <div class="info-details">
                            <strong>تاريخ الطلب:</strong> ${orderDate}<br>
                            <strong>العناصر:</strong> ${order.items.map(item => item.name).join(', ')}<br>
                            <strong>المجموع:</strong> ${order.financial.total.toLocaleString()} دينار<br>
                            <strong>طريقة الدفع:</strong> ${this.getPaymentMethodText(order.financial.paymentMethod)}
                        </div>
                    </div>

                    <!-- صورة الطلب -->
                    ${order.images && order.images.length > 0 ? `
                        <div class="info-section">
                            <div class="info-title">
                                <i class="fas fa-camera"></i>
                                صور الطلب
                            </div>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                ${order.images.map(img => `
                                    <img src="${img.url}" alt="${img.type}" class="order-image" 
                                         style="width: 120px; height: 80px; cursor: pointer;"
                                         onclick="this.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector('.modal-image').src = this.src; this.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector('.image-modal').style.display = 'block'">
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- المراحل الزمنية -->
                <div class="info-section">
                    <div class="info-title">
                        <i class="fas fa-clock"></i>
                        مراحل الطلب
                    </div>
                    <div class="timeline">
                        ${this.createTimeline(order.timing.stages)}
                    </div>
                </div>

                <!-- الموقع -->
                <div class="info-section">
                    <div class="info-title">
                        <i class="fas fa-map-marker-alt"></i>
                        الموقع
                    </div>
                    <div class="location-map" onclick="openLocationMap(${order.location.coordinates.lat}, ${order.location.coordinates.lng})">
                        <i class="fas fa-map"></i>
                        انقر لعرض الموقع على الخريطة - ${order.location.address}
                    </div>
                </div>

                <!-- الملاحظات -->
                ${order.notes ? `
                    <div class="info-section">
                        <div class="info-title">
                            <i class="fas fa-sticky-note"></i>
                            ملاحظات
                        </div>
                        <div class="info-details">${order.notes}</div>
                    </div>
                ` : ''}

                <!-- سبب الإلغاء -->
                ${order.cancelReason ? `
                    <div class="info-section">
                        <div class="info-title">
                            <i class="fas fa-times-circle"></i>
                            سبب الإلغاء
                        </div>
                        <div class="info-details" style="color: #f56565;">${order.cancelReason}</div>
                    </div>
                ` : ''}

                <!-- التقييم -->
                ${order.feedback ? `
                    <div class="info-section">
                        <div class="info-title">
                            <i class="fas fa-star"></i>
                            تقييم العميل
                        </div>
                        <div class="info-details">
                            <strong>التقييم:</strong> ${order.feedback.customerRating} ⭐<br>
                            ${order.feedback.customerComment ? `<strong>التعليق:</strong> ${order.feedback.customerComment}` : ''}
                        </div>
                    </div>
                ` : ''}

                <!-- أزرار العمليات -->
                <div class="action-buttons">
                    <button class="btn btn-view" onclick="adminDashboard.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i> عرض التفاصيل
                    </button>
                    <button class="btn btn-edit" onclick="adminDashboard.editOrder('${order.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    ${order.orderDetails.status !== 'completed' ? `
                        <button class="btn btn-primary" onclick="adminDashboard.updateOrderStatus('${order.id}', 'completed')">
                            <i class="fas fa-check"></i> تأكيد التسليم
                        </button>
                    ` : ''}
                    ${order.orderDetails.status === 'pending' || order.orderDetails.status === 'in_transit' ? `
                        <button class="btn btn-delete" onclick="adminDashboard.cancelOrder('${order.id}')">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="adminDashboard.printOrder('${order.id}')">
                        <i class="fas fa-print"></i> طباعة
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    createTimeline(stages) {
        const stageNames = {
            'created': 'تم إنشاء الطلب',
            'assigned': 'تم تعيين المراسل',
            'picked_up': 'تم استلام الطلب',
            'in_transit': 'في الطريق',
            'delivered': 'تم التسليم'
        };

        return stages.map(stage => {
            const iconClass = stage.completed ? 'timeline-completed' : 'timeline-pending';
            const icon = stage.completed ? 'fa-check' : 'fa-clock';
            const timeText = stage.time ? new Date(stage.time).toLocaleString('ar-IQ') : 'في الانتظار';

            return `
                <div class="timeline-item">
                    <div class="timeline-icon ${iconClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">${stageNames[stage.stage]}</div>
                        <div class="timeline-time">${timeText}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'completed': 'مكتمل',
            'pending': 'قيد الانتظار',
            'in_transit': 'في الطريق',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || status;
    }

    getPaymentMethodText(method) {
        const methodMap = {
            'cash': 'نقداً',
            'card': 'بطاقة ائتمان',
            'online': 'دفع إلكتروني'
        };
        return methodMap[method] || method;
    }

    formatDuration(minutes) {
        if (!minutes) return 'غير محدد';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours} ساعة و ${mins} دقيقة`;
        }
        return `${mins} دقيقة`;
    }

    updateStatistics() {
        const completed = this.ordersData.filter(o => o.orderDetails.status === 'completed').length;
        const pending = this.ordersData.filter(o => 
            ['pending', 'in_transit'].includes(o.orderDetails.status)
        ).length;
        const cancelled = this.ordersData.filter(o => o.orderDetails.status === 'cancelled').length;
        const messengers = [...new Set(this.ordersData.map(o => o.messenger.id))].length;

        document.getElementById('completedOrders').textContent = completed;
        document.getElementById('pendingOrders').textContent = pending;
        document.getElementById('cancelledOrders').textContent = cancelled;
        document.getElementById('activeMessengers').textContent = messengers;
    }

    loadMessengerOptions() {
        const messengerFilter = document.getElementById('messengerFilter');
        if (!messengerFilter) return;

        const messengers = [...new Set(this.ordersData.map(o => ({
            id: o.messenger.id,
            name: o.messenger.name
        })))];
        
        messengers.forEach(messenger => {
            const option = document.createElement('option');
            option.value = messenger.id;
            option.textContent = messenger.name;
            messengerFilter.appendChild(option);
        });
    }

    filterOrders() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const messengerFilter = document.getElementById('messengerFilter')?.value || '';
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';

        this.filteredData = this.ordersData.filter(order => {
            // البحث النصي
            const matchesSearch = searchTerm === '' || 
                order.id.toLowerCase().includes(searchTerm) ||
                order.messenger.name.toLowerCase().includes(searchTerm) ||
                order.customer.name.toLowerCase().includes(searchTerm) ||
                order.location.address.toLowerCase().includes(searchTerm);

            // فلتر الحالة
            const matchesStatus = statusFilter === '' || order.orderDetails.status === statusFilter;

            // فلتر المراسل
            const matchesMessenger = messengerFilter === '' || order.messenger.id === messengerFilter;

            // فلتر التاريخ
            const orderDate = new Date(order.orderDetails.orderDate);
            const matchesDateFrom = dateFrom === '' || orderDate >= new Date(dateFrom);
            const matchesDateTo = dateTo === '' || orderDate <= new Date(dateTo);

            return matchesSearch && matchesStatus && matchesMessenger && matchesDateFrom && matchesDateTo;
        });

        this.currentPage = 1;
        this.displayOrders();
    }

    applyFilters() {
        this.filterOrders();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('messengerFilter').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        this.filteredData = [...this.ordersData];
        this.currentPage = 1;
        this.displayOrders();
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        pagination.innerHTML = '';

        // زر السابق
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-right"></i> السابق';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => this.changePage(this.currentPage - 1);
        pagination.appendChild(prevBtn);

        // أرقام الصفحات
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === this.currentPage ? 'active' : '';
            pageBtn.onclick = () => this.changePage(i);
            pagination.appendChild(pageBtn);
        }

        // زر التالي
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = 'التالي <i class="fas fa-chevron-left"></i>';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.onclick = () => this.changePage(this.currentPage + 1);
        pagination.appendChild(nextBtn);

        // معلومات الصفحة
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `صفحة ${this.currentPage} من ${totalPages} (${this.filteredData.length} طلب)`;
        pageInfo.style.margin = '0 20px';
        pageInfo.style.color = '#718096';
        pagination.appendChild(pageInfo);
    }

    changePage(page) {
        this.currentPage = page;
        this.displayOrders();
    }

    viewOrderDetails(orderId) {
        const order = this.ordersData.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.getElementById('orderModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = `تفاصيل الطلب ${order.id}`;
        
        modalBody.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div class="info-section">
                    <h3><i class="fas fa-info-circle"></i> معلومات عامة</h3>
                    <p><strong>رقم الطلب:</strong> ${order.id}</p>
                    <p><strong>تاريخ الطلب:</strong> ${new Date(order.orderDetails.orderDate).toLocaleString('ar-IQ')}</p>
                    <p><strong>الحالة:</strong> ${this.getStatusText(order.orderDetails.status)}</p>
                    <p><strong>الأولوية:</strong> ${order.orderDetails.priority === 'high' ? 'عالية' : 'عادية'}</p>
                    <p><strong>المدة الإجمالية:</strong> ${this.formatDuration(order.timing.totalDuration)}</p>
                </div>
                
                <div class="info-section">
                    <h3><i class="fas fa-user"></i> المراسل</h3>
                    <p><strong>الاسم:</strong> ${order.messenger.name}</p>
                    <p><strong>الهاتف:</strong> ${order.messenger.phone}</p>
                    <p><strong>التقييم:</strong> ${order.messenger.rating} ⭐</p>
                </div>
                
                <div class="info-section">
                    <h3><i class="fas fa-user-circle"></i> العميل</h3>
                    <p><strong>الاسم:</strong> ${order.customer.name}</p>
                    <p><strong>الهاتف:</strong> ${order.customer.phone}</p>
                    <p><strong>العنوان:</strong> ${order.location.address}</p>
                </div>
                
                <div class="info-section">
                    <h3><i class="fas fa-shopping-cart"></i> العناصر والمالية</h3>
                    <ul style="margin-bottom: 10px;">
                        ${order.items.map(item => `
                            <li>${item.name} - الكمية: ${item.quantity} - السعر: ${item.price.toLocaleString()} دينار</li>
                        `).join('')}
                    </ul>
                    <p><strong>المجموع الفرعي:</strong> ${order.financial.subtotal.toLocaleString()} دينار</p>
                    <p><strong>رسوم التوصيل:</strong> ${order.financial.deliveryFee.toLocaleString()} دينار</p>
                    <p><strong>المجموع الكلي:</strong> ${order.financial.total.toLocaleString()} دينار</p>
                    <p><strong>طريقة الدفع:</strong> ${this.getPaymentMethodText(order.financial.paymentMethod)}</p>
                    <p><strong>حالة الدفع:</strong> ${order.financial.paymentStatus}</p>
                </div>
            </div>
            
            <div class="info-section" style="margin-top: 20px;">
                <h3><i class="fas fa-clock"></i> المراحل الزمنية</h3>
                <div class="timeline">
                    ${this.createTimeline(order.timing.stages)}
                </div>
            </div>
            
            ${order.images && order.images.length > 0 ? `
                <div class="info-section" style="margin-top: 20px;">
                    <h3><i class="fas fa-camera"></i> صور الطلب</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${order.images.map(img => `
                            <div style="text-align: center;">
                                <img src="${img.url}" alt="${img.type}" style="width: 200px; height: 150px; object-fit: cover; border-radius: 10px; cursor: pointer;" 
                                     onclick="window.open(this.src, '_blank')">
                                <p style="font-size: 0.8rem; margin-top: 5px;">${img.type === 'pickup' ? 'صورة الاستلام' : 'صورة التسليم'}</p>
                                <p style="font-size: 0.7rem; color: #718096;">${new Date(img.timestamp).toLocaleString('ar-IQ')}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${order.notes ? `
                <div class="info-section" style="margin-top: 20px;">
                    <h3><i class="fas fa-sticky-note"></i> ملاحظات</h3>
                    <p>${order.notes}</p>
                </div>
            ` : ''}

            ${order.feedback ? `
                <div class="info-section" style="margin-top: 20px;">
                    <h3><i class="fas fa-star"></i> تقييم العميل</h3>
                    <p><strong>التقييم:</strong> ${order.feedback.customerRating} ⭐</p>
                    ${order.feedback.customerComment ? `<p><strong>التعليق:</strong> ${order.feedback.customerComment}</p>` : ''}
                </div>
            ` : ''}
        `;

        modal.style.display = 'block';
    }

    editOrder(orderId) {
        // هنا يمكن فتح نافذة تعديل الطلب
        alert(`سيتم فتح نافذة تعديل الطلب ${orderId}`);
    }

    async updateOrderStatus(orderId, newStatus) {
        if (confirm(`هل أنت متأكد من تغيير حالة الطلب ${orderId} إلى ${this.getStatusText(newStatus)}؟`)) {
            try {
                // محاكاة استدعاء API
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const orderIndex = this.ordersData.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    this.ordersData[orderIndex].orderDetails.status = newStatus;
                    if (newStatus === 'completed') {
                        this.ordersData[orderIndex].orderDetails.completedDate = new Date().toISOString();
                        this.ordersData[orderIndex].timing.stages.find(s => s.stage === 'delivered').completed = true;
                        this.ordersData[orderIndex].timing.stages.find(s => s.stage === 'delivered').time = new Date().toISOString();
                    }
                    
                    this.filterOrders();
                    this.updateStatistics();
                    alert('تم تحديث حالة الطلب بنجاح');
                }
            } catch (error) {
                alert('حدث خطأ في تحديث حالة الطلب');
            }
        }
    }

    async cancelOrder(orderId) {
        const reason = prompt('يرجى إدخال سبب الإلغاء:');
        if (reason && confirm(`هل أنت متأكد من إلغاء الطلب ${orderId}؟`)) {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const orderIndex = this.ordersData.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    this.ordersData[orderIndex].orderDetails.status = 'cancelled';
                    this.ordersData[orderIndex].cancelReason = reason;
                    this.ordersData[orderIndex].financial.paymentStatus = 'cancelled';
                    
                    this.filterOrders();
                    this.updateStatistics();
                    alert('تم إلغاء الطلب بنجاح');
                }
            } catch (error) {
                alert('حدث خطأ في إلغاء الطلب');
            }
        }
    }

    printOrder(orderId) {
        const order = this.ordersData.find(o => o.id === orderId);
        if (!order) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>طباعة الطلب ${order.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .section { margin: 20px 0; }
                    .label { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>تفاصيل الطلب</h1>
                    <h2>${order.id}</h2>
                </div>
                
                <div class="section">
                    <h3>معلومات المراسل</h3>
                    <p><span class="label">الاسم:</span> ${order.messenger.name}</p>
                    <p><span class="label">الهاتف:</span> ${order.messenger.phone}</p>
                </div>
                
                <div class="section">
                    <h3>معلومات العميل</h3>
                    <p><span class="label">الاسم:</span> ${order.customer.name}</p>
                    <p><span class="label">الهاتف:</span> ${order.customer.phone}</p>
                    <p><span class="label">العنوان:</span> ${order.location.address}</p>
                </div>
                
                <div class="section">
                    <h3>تفاصيل الطلب</h3>
                    <p><span class="label">تاريخ الطلب:</span> ${new Date(order.orderDetails.orderDate).toLocaleString('ar-IQ')}</p>
                    <p><span class="label">الحالة:</span> ${this.getStatusText(order.orderDetails.status)}</p>
                    <p><span class="label">المجموع:</span> ${order.financial.total.toLocaleString()} دينار</p>
                </div>
                
                <div class="section">
                    <h3>العناصر</h3>
                    <ul>
                        ${order.items.map(item => `<li>${item.name} - ${item.quantity} × ${item.price.toLocaleString()} دينار</li>`).join('')}
                    </ul>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    exportToExcel() {
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
            "رقم الطلب,المراسل,هاتف المراسل,العميل,هاتف العميل,العنوان,تاريخ الطلب,الحالة,المدة,المجموع,طريقة الدفع,الملاحظات\n" +
            this.filteredData.map(order => 
                `"${order.id}","${order.messenger.name}","${order.messenger.phone}","${order.customer.name}","${order.customer.phone}","${order.location.address}","${new Date(order.orderDetails.orderDate).toLocaleDateString('ar-IQ')}","${this.getStatusText(order.orderDetails.status)}","${this.formatDuration(order.timing.totalDuration)}","${order.financial.total}","${this.getPaymentMethodText(order.financial.paymentMethod)}","${order.notes || ''}"`
            ).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    closeModal() {
        document.getElementById('orderModal').style.display = 'none';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showError(message) {
        const ordersGrid = document.getElementById('ordersGrid');
        if (ordersGrid) {
            ordersGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #f56565;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p style="font-size: 1.2rem;">${message}</p>
                </div>
            `;
        }
        this.hideLoading();
    }

    startRealTimeUpdates() {
        // محاكاة التحديثات في الوقت الفعلي
        setInterval(() => {
            this.simulateOrderUpdates();
        }, 30000); // كل 30 ثانية
    }

    simulateOrderUpdates() {
        // محاكاة تحديث عشوائي لحالة الطلبات
        const pendingOrders = this.ordersData.filter(o => o.orderDetails.status === 'in_transit');
        if (pendingOrders.length > 0 && Math.random() > 0.7) {
            const randomOrder = pendingOrders[Math.floor(Math.random() * pendingOrders.length)];
            randomOrder.orderDetails.status = 'completed';
            randomOrder.orderDetails.completedDate = new Date().toISOString();
            
            this.filterOrders();
            this.updateStatistics();
            
            // إشعار بالتحديث
            this.showNotification(`تم تسليم الطلب ${randomOrder.id} بنجاح`);
        }
    }

    showNotification(message) {
        // إنشاء إشعار مؤقت
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// دوال مساعدة عامة
function openLocationMap(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
}

function applyFilters() {
    if (window.adminDashboard) {
        window.adminDashboard.applyFilters();
    }
}

function clearFilters() {
    if (window.adminDashboard) {
        window.adminDashboard.clearFilters();
    }
}

function exportToExcel() {
    if (window.adminDashboard) {
        window.adminDashboard.exportToExcel();
    }
}

function closeModal() {
    if (window.adminDashboard) {
        window.adminDashboard.closeModal();
    }
}

// تهيئة لوحة الإدارة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
    
    // إضافة أنماط CSS للحركات
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .fade-in {
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});
