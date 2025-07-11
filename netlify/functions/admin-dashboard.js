// public/js/admin-dashboard.js
class OrdersManager {
    constructor() {
        this.apiBaseUrl = '/.netlify/functions';
        this.allOrders = [];
        this.filteredOrders = [];
        this.currentFilters = {};
        this.isLoading = false;
        
        this.init();
    }

    // تهيئة التطبيق
    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.loadOrders();
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // مستمع إغلاق النافذة المنبثقة
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('mediaModal');
            if (event.target === modal) {
                this.closeModal();
            }
        });

        // مستمع مفاتيح الاختصار
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // تعيين التواريخ الافتراضية
    setDefaultDates() {
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) startDateInput.value = oneWeekAgo.toISOString().split('T')[0];
        if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
    }

    // تحميل الطلبات من API
    async loadOrders(filters = {}) {
        try {
            this.showLoading();
            
            // في بيئة التطوير، استخدم البيانات التجريبية
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.allOrders = this.getSampleOrders();
                this.filteredOrders = [...this.allOrders];
                this.updateStats();
                this.renderOrders();
                this.hideLoading();
                return;
            }

            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.apiBaseUrl}/orders-enhanced?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.allOrders = result.data;
                this.filteredOrders = [...this.allOrders];
                this.updateStats();
                this.renderOrders();
                this.hideLoading();
            } else {
                throw new Error(result.message || 'فشل في تحميل البيانات');
            }
            
        } catch (error) {
            console.error('خطأ في تحميل الطلبات:', error);
            this.showError('فشل في تحميل البيانات: ' + error.message);
            this.hideLoading();
        }
    }

    // بيانات تجريبية للاختبار
    getSampleOrders() {
        return [
            {
                id: "ORD-001",
                employeeName: "أحمد محمد",
                orderDate: "2024-01-15",
                videoType: "أخبار محلية",
                status: "completed",
                location: {
                    address: "شارع الحبيبية، بغداد",
                    coordinates: { lat: 33.3152, lng: 44.3661 }
                },
                capturedMedia: [
                    { type: "image", url: "https://via.placeholder.com/400x300/3498db/white?text=صورة+1", timestamp: "2024-01-15 10:30", fileName: "image1.jpg", fileSize: 245760 },
                    { type: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4", timestamp: "2024-01-15 10:35", fileName: "video1.mp4", fileSize: 5242880 }
                ],
                description: "تغطية افتتاح مشروع تطوير الطرق",
                duration: "45 دقيقة",
                equipment: ["كاميرا HD", "ميكروفون لاسلكي"],
                notes: "تم التصوير في ظروف جوية مثالية",
                createdAt: "2024-01-15T08:00:00Z",
                updatedAt: "2024-01-15T12:00:00Z"
            },
            {
                id: "ORD-002",
                employeeName: "فاطمة علي",
                orderDate: "2024-01-16",
                videoType: "مقابلة شخصية",
                status: "pending",
                location: {
                    address: "منطقة الكرادة، بغداد",
                    coordinates: { lat: 33.3062, lng: 44.3926 }
                },
                capturedMedia: [
                    { type: "image", url: "https://via.placeholder.com/400x300/e74c3c/white?text=صورة+2", timestamp: "2024-01-16 14:20", fileName: "image2.jpg", fileSize: 187392 }
                ],
                description: "مقابلة مع مسؤول محلي حول التطوير العمراني",
                duration: "30 دقيقة",
                equipment: ["كاميرا 4K", "إضاءة احترافية"],
                notes: "في انتظار الموافقة النهائية",
                createdAt: "2024-01-16T09:00:00Z",
                updatedAt: "2024-01-16T15:00:00Z"
            },
            {
                id: "ORD-003",
                employeeName: "محمد حسين",
                orderDate: "2024-01-17",
                videoType: "تقرير ميداني",
                status: "completed",
                location: {
                    address: "ساحة التحرير، بغداد",
                    coordinates: { lat: 33.3386, lng: 44.4123 }
                },
                capturedMedia: [
                    { type: "image", url: "https://via.placeholder.com/400x300/27ae60/white?text=صورة+3", timestamp: "2024-01-17 09:15", fileName: "image3.jpg", fileSize: 301056 },
                    { type: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4", timestamp: "2024-01-17 09:30", fileName: "video2.mp4", fileSize: 7340032 },
                    { type: "image", url: "https://via.placeholder.com/400x300/f39c12/white?text=صورة+4", timestamp: "2024-01-17 10:00", fileName: "image4.jpg", fileSize: 256000 }
                ],
                description: "تقرير حول فعاليات اليوم الوطني",
                duration: "60 دقيقة",
                equipment: ["كاميرا HD", "حامل ثلاثي", "ميكروفون"],
                notes: "تصوير ممتاز بجودة عالية",
                createdAt: "2024-01-17T07:00:00Z",
                updatedAt: "2024-01-17T11:00:00Z"
            }
        ];
    }

    // تصفية الطلبات
    filterOrders() {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;

        if (!startDate || !endDate) {
            this.showNotification('يرجى تحديد نطاق التاريخ', 'warning');
            return;
        }

        this.filteredOrders = this.allOrders.filter(order => {
            const orderDate = new Date(order.orderDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return orderDate >= start && orderDate <= end;
        });

        this.updateStats();
        this.renderOrders();
    }

    // تحديث البيانات
    refreshData() {
        this.showNotification('جاري تحديث البيانات...', 'info');
        this.loadOrders(this.currentFilters);
        this.showNotification('تم تحديث البيانات بنجاح', 'success');
    }

    // إظهار مؤشر التحميل
    showLoading() {
        this.isLoading = true;
        const loadingEl = document.getElementById('loading');
        const containerEl = document.getElementById('ordersContainer');
        const noDataEl = document.getElementById('noData');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (containerEl) containerEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'none';
    }

    // إخفاء مؤشر التحميل
    hideLoading() {
        this.isLoading = false;
        const loadingEl = document.getElementById('loading');
        const containerEl = document.getElementById('ordersContainer');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (containerEl) containerEl.style.display = 'block';
    }

    // عرض رسالة خطأ
    showError(message) {
        this.showNotification(message, 'error');
        this.showNoData();
    }

    // عرض رسالة عدم وجود بيانات
    showNoData() {
        const loadingEl = document.getElementById('loading');
        const containerEl = document.getElementById('ordersContainer');
        const noDataEl = document.getElementById('noData');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (containerEl) containerEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'block';
    }

    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#27ae60'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: bold;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // تحديث الإحصائيات
    updateStats() {
        const total = this.filteredOrders.length;
        const pending = this.filteredOrders.filter(o => o.status === 'pending').length;
        const completed = this.filteredOrders.filter(o => o.status === 'completed').length;
        const today = this.filteredOrders.filter(o => o.orderDate === new Date().toISOString().split('T')[0]).length;

        this.updateStatElement('totalOrders', total);
        this.updateStatElement('pendingOrders', pending);
        this.updateStatElement('completedOrders', completed);
        this.updateStatElement('todayOrders', today);
    }

    // تحديث عنصر إحصائي واحد
    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value.toLocaleString('ar-SA');
        }
    }

    // عرض الطلبات في الجدول
    renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredOrders.length === 0) {
            this.showNoData();
            return;
        }

        this.filteredOrders.forEach(order => {
            const row = this.createOrderRow(order);
            tbody.appendChild(row);
        });
    }

    // إنشاء صف الطلب
    createOrderRow(order) {
        const row = document.createElement('tr');
        row.className = 'order-row';
        
        const statusInfo = this.getStatusInfo(order.status);
        const formattedDate = this.formatDate(order.orderDate);

        row.innerHTML = `
            <td><strong>${order.id}</strong></td>
            <td><strong>${order.employeeName}</strong></td>
            <td>${formattedDate}</td>
            <td>${order.videoType}</td>
            <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
            <td>${order.location.address}</td>
            <td>
                <button class="toggle-btn" onclick="ordersManager.toggleOrderDetails('${order.id}')" 
                        id="toggle-${order.id}">
                    عرض التفاصيل
                </button>
            </td>
        `;

        // إضافة صف التفاصيل
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.innerHTML = `
            <td colspan="7">
                <div class="order-details" id="details-${order.id}">
                    ${this.createOrderDetails(order)}
                </div>
            </td>
        `;

        // إرجاع fragment يحتوي على الصفين
        const fragment = document.createDocumentFragment();
        fragment.appendChild(row);
        fragment.appendChild(detailsRow);
        
        return fragment;
    }

    // الحصول على معلومات الحالة
    getStatusInfo(status) {
        const statusMap = {
            'pending': { class: 'status-pending', text: 'معلق' },
            'completed': { class: 'status-completed', text: 'مكتمل' },
            'cancelled': { class: 'status-cancelled', text: 'ملغي' }
        };
        return statusMap[status] || { class: 'status-unknown', text: 'غير معروف' };
    }

    // إنشاء تفاصيل الطلب
    createOrderDetails(order) {
        const mediaHtml = this.createMediaHtml(order.capturedMedia || []);
        const equipmentList = Array.isArray(order.equipment) ? order.equipment.join(', ') : 'غير محدد';

        return `
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">📝 الوصف:</div>
                    <div class="detail-value">${order.description || 'غير متوفر'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">⏱️ المدة:</div>
                    <div class="detail-value">${order.duration || 'غير محدد'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">📍 الإحداثيات:</div>
                    <div class="detail-value">
                        خط العرض: ${order.location.coordinates?.lat || 'غير محدد'}<br>
                        خط الطول: ${order.location.coordinates?.lng || 'غير محدد'}
                        ${order.location.coordinates?.lat ? `
                            <br><button class="btn" onclick="ordersManager.openMap(${order.location.coordinates.lat}, ${order.location.coordinates.lng})">
                                🗺️ عرض في الخريطة
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">🎥 المعدات المستخدمة:</div>
                    <div class="detail-value">${equipmentList}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">📋 ملاحظات:</div>
                    <div class="detail-value">${order.notes || 'لا توجد ملاحظات'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">📁 عدد الملفات:</div>
                    <div class="detail-value">${order.capturedMedia?.length || 0} ملف</div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <div class="detail-label">🖼️ الوسائط المرفقة:</div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                    ${mediaHtml}
                </div>
            </div>
        `;
    }

    // إنشاء HTML للوسائط
    createMediaHtml(mediaArray) {
        return mediaArray.map(media => {
            const fileSize = media.fileSize ? this.formatFileSize(media.fileSize) : '';
            const timestamp = this.formatDateTime(media.timestamp);
            
            if (media.type === 'image') {
                return `
                    <div style="text-align: center;">
                        <img src="${media.url}" alt="${media.fileName || 'صورة'}" 
                             class="media-preview" 
                             onclick="ordersManager.openModal('${media.url}', 'image')"
                             title="اسم الملف: ${media.fileName || 'غير محدد'}">
                        <div style="font-size: 0.8rem; color: #7f8c8d;">
                            ${media.fileName || 'صورة'}<br>
                            ${fileSize} | ${timestamp}
                        </div>
                    </div>
                `;
            } else if (media.type === 'video') {
                return `
                    <div style="text-align: center;">
                        <video src="${media.url}" class="media-preview" controls preload="metadata"
                               onclick="ordersManager.openModal('${media.url}', 'video')"
                               title="اسم الملف: ${media.fileName || 'غير محدد'}">
                        </video>
                        <div style="font-size: 0.8rem; color: #7f8c8d;">
                            ${media.fileName || 'فيديو'}<br>
                            ${fileSize} | ${timestamp}
                        </div>
                    </div>
                `;
            }
            return '';
        }).join('');
    }

    // تبديل عرض تفاصيل الطلب
    toggleOrderDetails(orderId) {
        const details = document.getElementById(`details-${orderId}`);
        const button = document.getElementById(`toggle-${orderId}`);
        
        if (!details || !button) return;

        const isActive = details.classList.contains('active');
        
        details.classList.toggle('active');
        button.textContent = details.classList.contains('active') ? 'إخفاء التفاصيل' : 'عرض التفاصيل';
    }

    // فتح نافذة عرض الوسائط
    openModal(url, type) {
        const modal = document.getElementById('mediaModal');
        const modalContent = document.getElementById('modalContent');
        
        if (!modal || !modalContent) return;

        let content = '';
        if (type === 'image') {
            content = `<img src="${url}" alt="صورة مكبرة" style="max-width: 100%; max-height: 100%;">`;
        } else if (type === 'video') {
            content = `<video src="${url}" controls autoplay style="max-width: 100%; max-height: 100%;">`;
        }
        
        modalContent.innerHTML = content;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // إغلاق نافذة العرض
    closeModal() {
        const modal = document.getElementById('mediaModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // فتح الموقع في الخريطة
    openMap(lat, lng) {
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(googleMapsUrl, '_blank');
    }

    // تصدير البيانات إلى Excel
    exportToExcel() {
        if (this.filteredOrders.length === 0) {
            this.showNotification('لا توجد بيانات للتصدير', 'warning');
            return;
        }

        try {
            const exportData = this.filteredOrders.map(order => ({
                'معرف الطلب': order.id,
                'اسم المراسل': order.employeeName,
                'تاريخ الطلب': this.formatDate(order.orderDate),
                'نوع الفيديو': order.videoType,
                'الحالة': this.getStatusInfo(order.status).text,
                'العنوان': order.location.address,
                'خط العرض': order.location.coordinates?.lat || '',
                'خط الطول': order.location.coordinates?.lng || '',
                'الوصف': order.description || '',
                'المدة': order.duration || '',
                'المعدات': Array.isArray(order.equipment) ? order.equipment.join(', ') : '',
                'الملاحظات': order.notes || '',
                'عدد الملفات المرفقة': order.capturedMedia?.length || 0,
                'تاريخ الإنشاء': this.formatDateTime(order.createdAt),
                'آخر تحديث': this.formatDateTime(order.updatedAt)
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "طلبات التصوير");

            const startDate = document.getElementById('startDate')?.value || 'غير_محدد';
            const endDate = document.getElementById('endDate')?.value || 'غير_محدد';
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `طلبات_التصوير_${startDate}_إلى_${endDate}_${timestamp}.xlsx`;

            XLSX.writeFile(wb, filename);
            this.showNotification('تم تصدير البيانات بنجاح', 'success');

        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            this.showNotification('فشل في تصدير البيانات: ' + error.message, 'error');
        }
    }

    // تنسيق التاريخ
    formatDate(dateString) {
        if (!dateString) return 'غير محدد';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // تنسيق التاريخ والوقت
    formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'غير محدد';
        const date = new Date(dateTimeString);
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // تنسيق حجم الملف
    formatFileSize(bytes) {
        if (!bytes) return '';
        if (bytes === 0) return '0 بايت';
        
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// إنشاء مثيل من مدير الطلبات عند تحميل الصفحة
let ordersManager;
document.addEventListener('DOMContentLoaded', function() {
    ordersManager = new OrdersManager();
});

// الدوال العامة للوصول من HTML
function filterOrders() {
    ordersManager.filterOrders();
}

function exportToExcel() {
    ordersManager.exportToExcel();
}

function refreshData() {
    ordersManager.refreshData();
}

function closeModal() {
    ordersManager.closeModal();
}
