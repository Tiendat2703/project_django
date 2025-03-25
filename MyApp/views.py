from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from .models import Customer, Product, Order, OrderDetail
from .forms import UploadFileForm
from django.utils.dateparse import parse_datetime
from django.utils import timezone
import csv

# 🔥 Upload CSV File View
def upload_csv(request):
    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            csv_file = request.FILES['file']
            
            if not csv_file.name.endswith('.csv'):
                return render(request, 'upload.html', {'error': 'File không phải là định dạng CSV'})
            
            file_data = csv_file.read().decode('utf-8').splitlines()
            csv_reader = csv.reader(file_data)
            next(csv_reader)  # Bỏ qua hàng tiêu đề
            
            for row in csv_reader:
                if len(row) == 13:  # Kiểm tra đúng số cột
                    customer, _ = Customer.objects.get_or_create(
                        customer_id=row[2],
                        defaults={'name': row[3], 'segment_code': row[4], 'segment_description': row[5]}
                    )
                    
                    product, _ = Product.objects.get_or_create(
                        product_code=row[8],
                        defaults={'product_name': row[9], 'group_code': row[6], 'group_name': row[7], 'price': row[11]}
                    )
                    
                    order, _ = Order.objects.get_or_create(
                        order_code=row[1],
                        customer=customer,
                        defaults={'created_at': parse_datetime(row[0].replace(' ', 'T'))}
                    )
                    
                    OrderDetail.objects.create(
                        order=order,
                        product=product,
                        quantity=int(row[10]),
                        total_amount=row[12]
                    )
            
            # Hiển thị nút bấm nếu upload thành công
            return render(request, 'upload.html', {'success': 'Tải lên dữ liệu thành công!'})
    else:
        form = UploadFileForm()
    
    products = Product.objects.all()  # Lấy toàn bộ sản phẩm
    groups = Product.objects.values('group_code', 'group_name').distinct()  # Lấy các nhóm hàng duy nhất
    
    return render(request, 'upload.html', {'form': form, 'products': products, 'groups': groups})


# 🔥 Trả dữ liệu về cho D3.js
def visualize_data(request):
    order_details = OrderDetail.objects.all().select_related('product', 'order', 'order__customer').values(
        'order__order_code',               # Mã đơn hàng
        'order__customer__customer_id',    # Mã khách hàng
        'product__product_code',           # Mã mặt hàng
        'product__product_name',           # Tên mặt hàng
        'product__group_code',             # Mã nhóm hàng
        'product__group_name',             # Tên nhóm hàng
        'order__created_at',               # Thời gian tạo đơn
        'quantity',                        # SL (Số lượng)
        'total_amount'                     # Thành tiền
    )

    data = [
        {
            "Mã đơn hàng": item['order__order_code'],
            "Mã khách hàng": item['order__customer__customer_id'],
            "Mã mặt hàng": item['product__product_code'],
            "Tên mặt hàng": item['product__product_name'],
            "Mã nhóm hàng": item['product__group_code'],
            "Tên nhóm hàng": item['product__group_name'],
            "Thời gian tạo đơn": item['order__created_at'].strftime('%Y-%m-%d %H:%M:%S') if item['order__created_at'] else "",
            "SL": item['quantity'],
            "Thành tiền": item['total_amount']
        }
        for item in order_details
    ]
    
    return JsonResponse(data, safe=False)


# 🔥 Thêm đơn hàng mới
def add_order(request):
    products = Product.objects.all()
    groups = Product.objects.values('group_code', 'group_name').distinct()

    if request.method == 'POST':
        customer, _ = Customer.objects.get_or_create(
            customer_id=request.POST['customer_id'],
            defaults={'name': request.POST['customer_name']}
        )

        order, _ = Order.objects.get_or_create(
            order_code=request.POST['order_code'],
            customer=customer,
            defaults={'created_at': timezone.now()}
        )

        product_code = request.POST['product_code']
        product = Product.objects.get(product_code=product_code)

        OrderDetail.objects.create(
            order=order,
            product=product,
            quantity=int(request.POST['quantity']),
            total_amount=request.POST['total_amount']
        )

        return HttpResponseRedirect('/upload/')   

    return render(request, 'upload.html', {'products': products, 'groups': groups})


# 🔥 API - Lấy sản phẩm theo Mã Nhóm Hàng (AJAX Request)
def get_products_by_group(request, group_code):
    products = Product.objects.filter(group_code=group_code).values('product_code', 'product_name')
    return JsonResponse(list(products), safe=False)


# 🔥 Trang chính hiển thị biểu đồ
def index(request):
    return render(request, 'index.html')
