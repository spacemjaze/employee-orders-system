// js/messenger-tracking.js

class MessengerTracking {
    constructor() {
        this.map = null;
        this.messengers = [];
        this.markers = {};
        this.selectedMessenger = null;
        this.updateInterval = null;
        this.init();
    }

    async init() {
        this.initMap();
        await this.loadMessengers();
        this.displayMessengers();
        this.addMarkersToMap();
        this.startRealTimeTracking();
    }

    initMap() {
        // إنشاء الخريطة مع التركيز على بغداد
        this.map = L.map('map').setView([33.3152, 44.3661], 11);

        // إضافة طبقة الخريطة
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // إضافة زر التحكم في الطبقات
        const baseLayers = {
            "الخريطة العادية": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            "خريطة الأقمار الصناعية": L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png')
        };

        L.control.layers(baseLayers).addTo(this.map);
    }

    async loadMessengers() {
        // محاكاة تحميل بيانات المراسلين من API
        this.messengers = [
            {
                id: 'MSG-001',
                name: 'أحمد محمد',
                phone: '+964 7901234567',
                status: 'delivering',
                rating: 4.8,
                currentLocation: { lat: 33.3128, lng: 44.3736 },
                currentOrder: {
                    id: 'ORD-001',
                    customerName: 'سارة أحمد',
                    destination: 'شارع الكرادة، بغداد',
                    estimatedArrival: '15:30',
                    priority: 'normal'
                },
                todayStats: {
                    ordersCompleted: 8,
                    ordersInProgress: 1,
                    totalEarnings: 185000,
                    hoursWorked: 6.5,
                    averageDeliveryTime: 35
                },
                route: [
                    { lat: 33.3128, lng: 44.3736, timestamp: new Date(Date.now() - 300000) },
                    { lat: 33.3100, lng: 44.3700, timestamp: new Date(Date.now() - 150000) },
                    { lat: 33.3080, lng: 44.3680, timestamp: new Date() }
                ],
                vehicle: {
                    type: 'motorcycle',
                    plate: 'بغداد 12345'
                }
            },
            {
                id: 'MSG-002',
                name: 'محمد علي',
                phone: '+964 7812345678',
                status: 'available',
                rating: 4.6,
                currentLocation: { lat: 33.2778, lng: 44.2306 },
                currentOrder: null,
                todayStats: {
                    ordersCompleted: 5,
                    ordersInProgress: 0,
                    totalEarnings: 125000,
                    hoursWorked: 5,
                    averageDeliveryTime: 40
                },
                route: [],
                vehicle: {
                    type: 'car',
                    plate: 'بغداد 67890'
                }
            },
            {
                id: 'MSG-003',
                name: 'علي حسن',
                phone: '+964 7723456789',
                status: 'busy',
                rating: 4.2,
                currentLocation: { lat: 33.2619, lng: 44.3742 },
                currentOrder: {
                    id: 'ORD-003',
                    customerName: 'فاطمة محمد',
                    destination: 'شارع الجادرية، بغداد',
                    estimatedArrival: '16:00',
                    priority: 'high'
                },
                todayStats: {
                    ordersCompleted: 6,
                    ordersInProgress: 1,
                    totalEarnings: 150000,
                    hoursWorked: 6,
                    averageDeliveryTime: 38
                },
                route: [
                    { lat: 33.2619, lng: 44.3742, timestamp: new Date(Date.now() - 200000) },
                    { lat: 33.2650, lng: 44.3720, timestamp: new Date() }
                ],
                vehicle: {
                    type: 'motorcycle',
                    plate: 'بغداد 11111'
                }
            },
            {
                id: 'MSG-004',
                name: 'حسن أحمد',
                phone: '+964 7934567890',
                status: 'offline',
                rating: 4.0,
                currentLocation: { lat: 33.3500, lng: 44.4000 },
                currentOrder: null,
                todayStats: {
                    ordersCompleted: 0,
                    ordersInProgress: 0,
                    totalEarnings: 0,
                    hoursWorked: 0,
                    averageDeliveryTime: 0
                },
                route: [],
                vehicle: {
                    type: 'bicycle',
                    plate: 'دراجة 001'
                }
            }
        ];
    }

    displayMessengers() {
        const messengerList = document.getElementById('messengerList');
        messengerList.innerHTML = '';

        this.messengers.forEach(messenger => {
            const card = this.createMessengerCard(messenger);
            messengerList.appendChild(card);
        });
    }

    createMessengerCard(messenger) {
        const card = document.createElement('div');
        card.className = `messenger-card ${messenger.id === this.selectedMessenger?.id ? 'active' : ''}`;
        card.onclick = () => this.selectMessenger(messenger);

        const statusText = this.getStatusText(messenger.status);
        const vehicleIcon = this.getVehicleIcon(messenger.vehicle.type);

        card.innerHTML = `
            <div class="status-indicator status-${messenger.status}"></div>
            <div class="messenger-header">
                <div class="messenger-name">${messenger.name}</div>
                <div style="color: #718096; font-size: 0.8rem;">
                    <i class="${vehicleIcon}"></i> ${messenger.vehicle.plate}
                </div>
            </div>
            
            <div class="messenger-info">
                <div style="margin-bottom: 8px;">
                    <strong>الحالة:</strong> <span style="color: ${this.getStatusColor(messenger.status)}">${statusText}</span><br>
                    <strong>الهاتف:</strong> ${messenger.phone}<br>
                    <strong>التقييم:</strong> ${messenger.rating} ⭐
                </div>
                
                ${messenger.currentOrder ? `
                    <div class="current-order ${messenger.currentOrder.priority === 'high' ? 'urgent' : ''}">
                        <div style="font-weight: 600; margin-bottom: 5px;">
                            <i class="fas fa-box"></i> طلب حالي: ${messenger.currentOrder.id}
                        </div>
                        <div style="font-size: 0.8rem;">
                            العميل: ${messenger.currentOrder.customerName}<br>
                            الوجهة: ${messenger.currentOrder.destination}<br>
                            الوصول المتوقع: ${messenger.currentOrder.estimatedArrival}
                            ${messenger.currentOrder.priority === 'high' ? '<br><span style="color: #f56565; font-weight: 600;">⚡ عاجل</span>' : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-value">${messenger.todayStats.ordersCompleted}</div>
                    <div class="stat-label">طلبات اليوم</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${(messenger.todayStats.totalEarnings / 1000).toFixed(0)}k</div>
                    <div class="stat-label">الأرباح (دينار)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${messenger.todayStats.hoursWorked}</div>
                    <div class="stat-label">ساعات العمل</div>
                </div>
            </div>
        `;

        return card;
    }

    getStatusText(status) {
        const statusMap = {
            'available': 'متاح',
            'busy': 'مشغول',
            'delivering': 'يوصل طلب',
            'offline': 'غير متصل'
        };
        return statusMap[status] || status;
    }

    getStatusColor(status) {
        const colorMap = {
            'available': '#48bb78',
            'busy': '#ed8936',
            'delivering': '#4299e1',
            'offline': '#cbd5e0'
        };
        return colorMap[status] || '#cbd5e0';
    }

    getVehicleIcon(type) {
        const iconMap = {
            'motorcycle': 'fas fa-motorcycle',
            'car': 'fas fa-car',
            'bicycle': 'fas fa-bicycle'
        };
        return iconMap[type] || 'fas fa-motorcycle';
    }

    addMarkersToMap() {
        // إزالة العلامات السابقة
        Object.values(this.markers).forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = {};

        // إضافة علامات جديدة
        this.messengers.forEach(messenger => {
            if (messenger.status !== 'offline') {
                const marker = this.createMarker(messenger);
                marker.addTo(this.map);
                this.markers[messenger.id] = marker;

                // إضافة مسار المراسل إذا كان متوفراً
                if (messenger.route && messenger.route.length > 1) {
                    const routeCoords = messenger.route.map(point => [point.lat, point.lng]);
                    const polyline = L.polyline(routeCoords, {
                        color: this.getStatusColor(messenger.status),
                        weight: 3,
                        opacity: 0.7,
                        dashArray: '5, 10'
                    }).addTo(this.map);
                    
                    this.markers[`${messenger.id}_route`] = polyline;
                }
            }
        });
    }

    createMarker(messenger) {
        const icon = this.createCustomIcon(messenger);
        const marker = L.marker([messenger.currentLocation.lat, messenger.currentLocation.lng], { icon });

        const popupContent = `
            <div class="popup-messenger-name">${messenger.name}</div>
            <div class="popup-status ${messenger.status}">${this.getStatusText(messenger.status)}</div>
            <div class="popup-details">
                ${messenger.currentOrder ? 
                    `طلب: ${messenger.currentOrder.id}<br>متجه إلى: ${messenger.currentOrder.destination}` : 
                    'متاح لاستقبال طلبات جديدة'
                }
            </div>
            <button onclick="messengerTracking.viewMessengerDetails('${messenger.id}')" 
                    style="margin-top: 10px; padding: 5px 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                عرض التفاصيل
            </button>
        `;

        marker.bindPopup(popupContent);
        
        // إضافة حدث النقر
        marker.on('click', () => {
            this.selectMessenger(messenger);
        });

        return marker;
    }

    createCustomIcon(messenger) {
        const color = this.getStatusColor(messenger.status);
        const vehicleIcon = this.getVehicleIcon(messenger.vehicle.type).replace('fas fa-', '');
        
        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: ${color};
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    border: 3px solid white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    position: relative;
                ">
                    <i class="fas fa-${vehicleIcon}"></i>
                    ${messenger.status === 'delivering' ? 
                        '<div style="position: absolute; top: -5px; right: -5px; width: 12px; height: 12px; background: #f56565; border-radius: 50%; animation: pulse 1s infinite;"></div>' : 
                        ''
                    }
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
    }

    selectMessenger(messenger) {
        this.selectedMessenger = messenger;
        this.displayMessengers();
        
        // تحريك الخريطة إلى موقع المراسل
        this.map.setView([messenger.currentLocation.lat, messenger.currentLocation.lng], 15);
        
        // إبراز العلامة
        if (this.markers[messenger.id]) {
            this.markers[messenger.id].openPopup();
        }
    }

    filterMessengers() {
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        const filteredMessengers = this.messengers.filter(messenger => {
            const matchesStatus = !statusFilter || messenger.status === statusFilter;
            const matchesSearch = !searchTerm || 
                messenger.name.toLowerCase().includes(searchTerm) ||
                messenger.phone.includes(searchTerm);
            
            return matchesStatus && matchesSearch;
        });

        // إخفاء جميع العلامات
        Object.values(this.markers).forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = {};

        // عرض المراسلين المفلترين
        const messengerList = document.getElementById('messengerList');
        messengerList.innerHTML = '';

        filteredMessengers.forEach(messenger => {
            const card = this.createMessengerCard(messenger);
            messengerList.appendChild(card);

            // إضافة العلامات للمراسلين المفلترين
            if (messenger.status !== 'offline') {
                const marker = this.createMarker(messenger);
                marker.addTo(this.map);
                this.markers[messenger.id] = marker;
            }
        });

        // تحديث حدود الخريطة لتشمل جميع المراسلين المرئيين
        if (filteredMessengers.length > 0) {
            const group = new L.featureGroup(Object.values(this.markers));
            if (group.getLayers().length > 0) {
                this.map.fitBounds(group.getBounds().pad(0.1));
            }
        }
    }

    viewMessengerDetails(messengerId) {
        const messenger = this.messengers.find(m => m.id === messengerId);
        if (!messenger) return;

        const modal = document.getElementById('messengerModal');
        const modalTitle = document.getElementById('modalMessengerName');
        const modalBody = document.getElementById('modalMessengerBody');

        modalTitle.textContent = messenger.name;

        modalBody.innerHTML = `
            <div class="messenger-stats">
                <div class="stat-card">
                    <h4>طلبات اليوم</h4>
                    <div class="value">${messenger.todayStats.ordersCompleted}</div>
                </div>
                <div class="stat-card">
                    <h4>طلبات جارية</h4>
                    <div class="value">${messenger.todayStats.ordersInProgress}</div>
                </div>
                <div class="stat-card">
                    <h4>أرباح اليوم</h4>
                    <div class="value">${messenger.todayStats.totalEarnings.toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <h4>ساعات العمل</h4>
                    <div class="value">${messenger.todayStats.hoursWorked}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div>
                    <h3><i class="fas fa-user"></i> معلومات شخصية</h3>
                    <div style="background: #f7fafc; border-radius: 10px; padding: 15px; margin-top: 10px;">
                        <p><strong>الاسم:</strong> ${messenger.name}</p>
                        <p><strong>الهاتف:</strong> ${messenger.phone}</p>
                        <p><strong>التقييم:</strong> ${messenger.rating} ⭐</p>
                        <p><strong>الحالة:</strong> <span style="color: ${this.getStatusColor(messenger.status)}">${this.getStatusText(messenger.status)}</span></p>
                        <p><strong>المركبة:</strong> <i class="${this.getVehicleIcon(messenger.vehicle.type)}"></i> ${messenger.vehicle.plate}</p>
                    </div>
                </div>

                <div>
                    <h3><i class="fas fa-map-marker-alt"></i> الموقع الحالي</h3>
                    <div style="background: #f7fafc; border-radius: 10px; padding: 15px; margin-top: 10px;">
                        <p><strong>خط العرض:</strong> ${messenger.currentLocation.lat.toFixed(6)}</p>
                        <p><strong>خط الطول:</strong> ${messenger.currentLocation.lng.toFixed(6)}</p>
                        <button onclick="messengerTracking.centerOnMessenger('${messenger.id}')" 
                                style="margin-top: 10px; padding: 8px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-crosshairs"></i> إظهار على الخريطة
                        </button>
                    </div>
                </div>
            </div>

            ${messenger.currentOrder ? `
                <div class="route-info">
                    <h3><i class="fas fa-route"></i> الطلب الحالي</h3>
                    <div style="background: white; border-radius: 10px; padding: 15px; margin-top: 10px;">
                        <p><strong>رقم الطلب:</strong> ${messenger.currentOrder.id}</p>
                        <p><strong>العميل:</strong> ${messenger.currentOrder.customerName}</p>
                        <p><strong>الوجهة:</strong> ${messenger.currentOrder.destination}</p>
                        <p><strong>الوصول المتوقع:</strong> ${messenger.currentOrder.estimatedArrival}</p>
                        <p><strong>الأولوية:</strong> ${messenger.currentOrder.priority === 'high' ? '🔴 عالية' : '🟢 عادية'}</p>
                    </div>
                </div>
            ` : ''}

            ${messenger.route && messenger.route.length > 0 ? `
                <div class="route-info">
                    <h3><i class="fas fa-route"></i> مسار الحركة</h3>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${messenger.route.map((point, index) => `
                            <div class="route-step">
                                <div class="route-icon ${index === messenger.route.length - 1 ? 'route-current' : 'route-completed'}">
                                    <i class="fas ${index === messenger.route.length - 1 ? 'fa-location-dot' : 'fa-check'}"></i>
                                </div>
                                <div class="route-content">
                                    <div class="route-title">نقطة ${index + 1}</div>
                                    <div class="route-time">${point.timestamp.toLocaleString('ar-IQ')}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="performance-chart">
                <h3><i class="fas fa-chart-bar"></i> أداء اليوم</h3>
                <div class="chart-bar">
                    <div class="chart-label">الطلبات</div>
                    <div class="chart-progress">
                        <div class="chart-fill" style="width: ${Math.min((messenger.todayStats.ordersCompleted / 10) * 100, 100)}%"></div>
                    </div>
                    <div class="chart-value">${messenger.todayStats.ordersCompleted}/10</div>
                </div>
                <div class="chart-bar">
                    <div class="chart-label">ساعات العمل</div>
                    <div class="chart-progress">
                        <div class="chart-fill" style="width: ${Math.min((messenger.todayStats.hoursWorked / 8) * 100, 100)}%"></div>
                    </div>
                    <div class="chart-value">${messenger.todayStats.hoursWorked}/8</div>
                </div>
                <div class="chart-bar">
                    <div class="chart-label">متوسط التوصيل</div>
                    <div class="chart-progress">
                        <div class="chart-fill" style="width: ${Math.max(100 - (messenger.todayStats.averageDeliveryTime / 60) * 100, 0)}%"></div>
                    </div>
                    <div class="chart-value">${messenger.todayStats.averageDeliveryTime} دقيقة</div>
                </div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button onclick="messengerTracking.callMessenger('${messenger.id}')" 
                        style="margin: 5px; padding: 10px 20px; background: #48bb78; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-phone"></i> اتصال
                </button>
                <button onclick="messengerTracking.sendMessage('${messenger.id}')" 
                        style="margin: 5px; padding: 10px 20px; background: #4299e1; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-message"></i> رسالة
                </button>
                <button onclick="messengerTracking.assignOrder('${messenger.id}')" 
                        style="margin: 5px; padding: 10px 20px; background: #ed8936; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-plus"></i> تعيين طلب
                </button>
            </div>
        `;

        modal.style.display = 'block';
    }

    centerOnMessenger(messengerId) {
        const messenger = this.messengers.find(m => m.id === messengerId);
        if (messenger) {
            this.map.setView([messenger.currentLocation.lat, messenger.currentLocation.lng], 16);
            this.closeMessengerModal();
            this.selectMessenger(messenger);
        }
    }

    callMessenger(messengerId) {
        const messenger = this.messengers.find(m => m.id === messengerId);
        if (messenger) {
            window.open(`tel:${messenger.phone}`, '_self');
        }
    }

    sendMessage(messengerId) {
        const messenger = this.messengers.find(m => m.id === messengerId);
        if (messenger) {
            const message = prompt(`إرسال رسالة إلى ${messenger.name}:`);
            if (message) {
                alert(`تم إرسال الرسالة: "${message}" إلى ${messenger.name}`);
            }
        }
    }

    assignOrder(messengerId) {
        const messenger = this.messengers.find(m => m.id === messengerId);
        if (messenger && messenger.status === 'available') {
            alert(`سيتم فتح نافذة تعيين طلب جديد للمراسل ${messenger.name}`);
        } else {
            alert('المراسل غير متاح لاستقبال طلبات جديدة');
        }
    }

    closeMessengerModal() {
        document.getElementById('messengerModal').style.display = 'none';
    }

    startRealTimeTracking() {
        // تحديث المواقع كل 30 ثانية
        this.updateInterval = setInterval(() => {
            this.updateMessengerLocations();
        }, 30000);
    }

    updateMessengerLocations() {
        // محاكاة تحديث مواقع المراسلين
        this.messengers.forEach(messenger => {
            if (messenger.status !== 'offline') {
                // تحديث عشوائي بسيط للموقع
                const deltaLat = (Math.random() - 0.5) * 0.002;
                const deltaLng = (Math.random() - 0.5) * 0.002;
                
                messenger.currentLocation.lat += deltaLat;
                messenger.currentLocation.lng += deltaLng;

                // تحديث المسار
                if (messenger.route.length > 5) {
                    messenger.route.shift(); // إزالة أقدم نقطة
                }
                messenger.route.push({
                    lat: messenger.currentLocation.lat,
                    lng: messenger.currentLocation.lng,
                    timestamp: new Date()
                });

                // تحديث العلامة على الخريطة
                if (this.markers[messenger.id]) {
                    this.markers[messenger.id].setLatLng([
                        messenger.currentLocation.lat,
                        messenger.currentLocation.lng
                    ]);
                }
            }
        });

        // إعادة رسم المسارات
        this.addMarkersToMap();
        this.displayMessengers();
    }

    refreshMap() {
        this.addMarkersToMap();
        this.showNotification('تم تحديث الخريطة');
    }

    centerMap() {
        // توسيط الخريطة على جميع المراسلين النشطين
        const activeMessengers = this.messengers.filter(m => m.status !== 'offline');
        if (activeMessengers.length > 0) {
            const bounds = L.latLngBounds();
            activeMessengers.forEach(messenger => {
                bounds.extend([messenger.currentLocation.lat, messenger.currentLocation.lng]);
            });
            this.map.fitBounds(bounds.pad(0.1));
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    showNotification(message) {
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    stopTracking() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// دوال مساعدة عامة
function filterMessengers() {
    if (window.messengerTracking) {
        window.messengerTracking.filterMessengers();
    }
}

function refreshMap() {
    if (window.messengerTracking) {
        window.messengerTracking.refreshMap();
    }
}

function centerMap() {
    if (window.messengerTracking) {
        window.messengerTracking.centerMap();
    }
}

function toggleFullscreen() {
    if (window.messengerTracking) {
        window.messengerTracking.toggleFullscreen();
    }
}

function closeMessengerModal() {
    if (window.messengerTracking) {
        window.messengerTracking.closeMessengerModal();
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.messengerTracking = new MessengerTracking();
    
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
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // إغلاق المودال عند النقر خارجه
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('messengerModal');
        if (event.target === modal) {
            closeMessengerModal();
        }
    });
});
