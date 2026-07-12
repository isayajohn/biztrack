<?php

use App\Http\Controllers\Api\AdminCollectionController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminPackageController;
use App\Http\Controllers\Api\AdminSubscriptionController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\EmailConfigController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\LandingController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PublicPackageController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SecurityConfigController;
use App\Http\Controllers\Api\SmsConfigController;
use App\Http\Controllers\Api\SmsTemplateController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\DamagedStockController;
use App\Http\Controllers\Api\InventoryNotificationController;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', fn() => response()->json(['success' => true, 'data' => ['status' => 'ok']]));

// Public landing & packages
Route::prefix('public')->group(function () {
    Route::get('/landing-page', [LandingController::class, 'getPublicLandingPage']);
    Route::get('/landing-page/branding', [LandingController::class, 'getBranding']);
    Route::get('/landing-page/branding/logo', [LandingController::class, 'getBrandingLogo']);
    Route::get('/landing-page/mobile-app.apk', [LandingController::class, 'downloadApk']);
    Route::get('/packages', [PublicPackageController::class, 'listPackages']);
});

// Landing (duplicate public routes for backward compat)
Route::prefix('landing-page')->group(function () {
    Route::get('/', [LandingController::class, 'getPublicLandingPage']);
    Route::get('/branding', [LandingController::class, 'getBranding']);
    Route::get('/branding/logo', [LandingController::class, 'getBrandingLogo']);
});

// Auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google', [AuthController::class, 'googleAuth']);
    Route::post('/request-login-otp', [AuthController::class, 'requestLoginOtp']);
    Route::post('/verify-login-otp', [AuthController::class, 'verifyOtpLogin']);
    Route::post('/login/otp', [AuthController::class, 'verifyOtpLogin']);
    Route::post('/send-verification-email', [AuthController::class, 'sendVerificationEmail']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware('jwt.auth');
    Route::get('/me', [AuthController::class, 'me'])->middleware('jwt.auth');
});

// Subscription callback (no auth)
Route::post('/subscriptions/azam-pay/callback', [SubscriptionController::class, 'azamPayCallback']);

// Authenticated routes
Route::middleware('jwt.auth')->group(function () {
    // Profile
    Route::get('/profile', [ProfileController::class, 'getProfile']);

    // Business
    Route::get('/business', [BusinessController::class, 'getBusinessProfile']);
    Route::put('/business', [BusinessController::class, 'updateBusinessProfile'])->middleware('permission:settings.manage');

    // Products
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'listProducts'])->middleware('permission:products.view');
        Route::post('/', [ProductController::class, 'createProduct'])->middleware('permission:products.manage');
        Route::get('/{id}', [ProductController::class, 'getProduct'])->middleware('permission:products.view');
        Route::put('/{id}', [ProductController::class, 'updateProduct'])->middleware('permission:products.manage');
        Route::delete('/{id}', [ProductController::class, 'deleteProduct'])->middleware('permission:products.manage');
    });

    Route::prefix('brands')->group(function () {
        Route::get('/', [BrandController::class, 'index'])->middleware('permission:products.view');
        Route::post('/', [BrandController::class, 'store'])->middleware('permission:products.manage');
        Route::put('/{id}', [BrandController::class, 'update'])->middleware('permission:products.manage');
        Route::delete('/{id}', [BrandController::class, 'destroy'])->middleware('permission:products.manage');
    });

    Route::get('/promotions', [PromotionController::class, 'index']);
    Route::middleware('permission:promotions.manage')->prefix('promotions')->group(function () {
        Route::post('/', [PromotionController::class, 'store']);
        Route::put('/{id}', [PromotionController::class, 'update']);
        Route::delete('/{id}', [PromotionController::class, 'destroy']);
    });

    Route::get('/branches', [BranchController::class, 'index']);
    Route::middleware('permission:branches.manage')->prefix('branches')->group(function () {
        Route::post('/', [BranchController::class, 'store']);
        Route::put('/{id}', [BranchController::class, 'update']);
        Route::put('/{id}/default', [BranchController::class, 'makeDefault']);
        Route::delete('/{id}', [BranchController::class, 'destroy']);
    });

    Route::middleware('permission:staff.manage')->prefix('staff')->group(function () {
        Route::get('/', [StaffController::class, 'index']);
        Route::post('/', [StaffController::class, 'store']);
        Route::put('/{id}', [StaffController::class, 'update']);
        Route::delete('/{id}', [StaffController::class, 'destroy']);
    });

    // Sales
    Route::prefix('sales')->group(function () {
        Route::get('/', [SaleController::class, 'listSales'])->middleware('permission:sales.view');
        Route::post('/', [SaleController::class, 'createSale'])->middleware('permission:sales.create');
        Route::post('/pos', [SaleController::class, 'createPosSale'])->middleware('permission:sales.create');
        Route::get('/{id}', [SaleController::class, 'getSale'])->middleware('permission:sales.view');
        Route::put('/{id}', [SaleController::class, 'updateSale'])->middleware('permission:sales.edit');
        Route::delete('/{id}', [SaleController::class, 'deleteSale'])->middleware('permission:sales.delete');
    });

    // Expenses
    Route::prefix('expenses')->group(function () {
        Route::get('/', [ExpenseController::class, 'listExpenses'])->middleware('permission:expenses.view');
        Route::post('/', [ExpenseController::class, 'createExpense'])->middleware('permission:expenses.manage');
        Route::get('/{id}', [ExpenseController::class, 'getExpense'])->middleware('permission:expenses.view');
        Route::put('/{id}', [ExpenseController::class, 'updateExpense'])->middleware('permission:expenses.manage');
        Route::delete('/{id}', [ExpenseController::class, 'deleteExpense'])->middleware('permission:expenses.manage');
    });

    // Dashboard
    Route::get('/dashboard', [ReportController::class, 'getDashboard'])->middleware('permission:dashboard.view');

    // Reports
    Route::get('/reports', [ReportController::class, 'getReports'])->middleware('permission:reports.view');
    Route::get('/reports/inventory-dashboard', [ReportController::class, 'inventoryDashboard'])->middleware('permission:inventory.view');
    Route::get('/reports/cash-flow', [ReportController::class, 'cashFlow'])->middleware('permission:reports.view');
    Route::get('/reports/purchases', [ReportController::class, 'purchaseReport'])->middleware('permission:reports.view');

    // Categories
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'listCategories'])->middleware('permission:products.view');
        Route::post('/', [CategoryController::class, 'createCategory'])->middleware('permission:products.manage');
        Route::put('/{id}', [CategoryController::class, 'updateCategory'])->middleware('permission:products.manage');
        Route::delete('/{id}', [CategoryController::class, 'deleteCategory'])->middleware('permission:products.manage');
    });

    // Suppliers
    Route::prefix('suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'listSuppliers'])->middleware('permission:purchases.view');
        Route::post('/', [SupplierController::class, 'createSupplier'])->middleware('permission:purchases.manage');
        Route::get('/{id}', [SupplierController::class, 'getSupplier'])->middleware('permission:purchases.view');
        Route::put('/{id}', [SupplierController::class, 'updateSupplier'])->middleware('permission:purchases.manage');
        Route::delete('/{id}', [SupplierController::class, 'deleteSupplier'])->middleware('permission:purchases.manage');
    });

    // Customers and customer credit
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index'])->middleware('permission:customers.view');
        Route::post('/', [CustomerController::class, 'store'])->middleware('permission:customers.manage');
        Route::get('/{id}', [CustomerController::class, 'show'])->middleware('permission:customers.view');
        Route::put('/{id}', [CustomerController::class, 'update'])->middleware('permission:customers.manage');
        Route::delete('/{id}', [CustomerController::class, 'destroy'])->middleware('permission:customers.manage');
        Route::get('/{id}/statement', [CustomerController::class, 'statement'])->middleware('permission:customers.view');
        Route::post('/{id}/payments', [CustomerController::class, 'recordPayment'])->middleware('permission:customers.manage');
    });

    // Stock
    Route::prefix('stock')->group(function () {
        Route::post('/in', [StockController::class, 'stockIn'])->middleware('permission:inventory.manage');
        Route::post('/out', [StockController::class, 'stockOut'])->middleware('permission:inventory.manage');
        Route::get('/movements', [StockController::class, 'getMovements'])->middleware('permission:inventory.view');
        Route::get('/low-stock', [StockController::class, 'getLowStock'])->middleware('permission:inventory.view');
        Route::get('/expired', [StockController::class, 'getExpired'])->middleware('permission:inventory.view');
        Route::get('/adjustments', [StockController::class, 'getAdjustments'])->middleware('permission:inventory.view');
        Route::post('/adjustment', [StockController::class, 'createAdjustment'])->middleware('permission:inventory.manage');
        Route::put('/adjustment/{id}/approve', [StockController::class, 'approveAdjustment'])->middleware('permission:inventory.manage');
        Route::put('/adjustment/{id}/reject', [StockController::class, 'rejectAdjustment'])->middleware('permission:inventory.manage');
    });

    // Purchases
    Route::prefix('purchases')->group(function () {
        Route::get('/', [PurchaseController::class, 'listPurchases'])->middleware('permission:purchases.view');
        Route::post('/', [PurchaseController::class, 'createPurchase'])->middleware('permission:purchases.manage');
        Route::get('/{id}', [PurchaseController::class, 'getPurchase'])->middleware('permission:purchases.view');
        Route::put('/{id}', [PurchaseController::class, 'updatePurchase'])->middleware('permission:purchases.manage');
        Route::put('/{id}/receive', [PurchaseController::class, 'receivePurchase'])->middleware('permission:purchases.manage');
        Route::delete('/{id}', [PurchaseController::class, 'deletePurchase'])->middleware('permission:purchases.manage');
    });

    // Damaged stock
    Route::prefix('damaged-stock')->group(function () {
        Route::get('/', [DamagedStockController::class, 'list']);
        Route::post('/', [DamagedStockController::class, 'create']);
        Route::put('/{id}/approve', [DamagedStockController::class, 'approve']);
        Route::put('/{id}/reject', [DamagedStockController::class, 'reject']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [InventoryNotificationController::class, 'list']);
        Route::get('/unread-count', [InventoryNotificationController::class, 'getUnreadCount']);
        Route::put('/mark-all-read', [InventoryNotificationController::class, 'markAllRead']);
        Route::put('/{id}/read', [InventoryNotificationController::class, 'markRead']);
    });

    // Subscriptions
    Route::prefix('subscriptions')->group(function () {
        Route::get('/current', [SubscriptionController::class, 'current']);
        Route::post('/checkout', [SubscriptionController::class, 'checkout']);
    });

    // AI
    Route::post('/ai/business-summary', [AiController::class, 'generateBusinessSummary']);

    // Admin routes
    Route::prefix('admin')->middleware('super.admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'getAdminStats']);
        Route::get('/summary', [AdminController::class, 'getSystemSummary']);

        // Branding
        Route::get('/branding', [AdminController::class, 'getBranding']);
        Route::put('/branding', [AdminController::class, 'updateBranding']);
        Route::delete('/branding/logo', [AdminController::class, 'removeBrandingLogo']);

        // Packages
        Route::prefix('packages')->group(function () {
            Route::get('/', [AdminPackageController::class, 'listPackages']);
            Route::post('/', [AdminPackageController::class, 'createPackage']);
            Route::get('/{id}', [AdminPackageController::class, 'getPackageById']);
            Route::put('/{id}', [AdminPackageController::class, 'updatePackage']);
            Route::patch('/{id}/status', [AdminPackageController::class, 'updatePackageStatus']);
            Route::delete('/{id}', [AdminPackageController::class, 'deletePackage']);
        });

        // Subscriptions management
        Route::prefix('subscriptions')->group(function () {
            Route::get('/', [AdminSubscriptionController::class, 'listSubscriptions']);
            Route::post('/', [AdminSubscriptionController::class, 'assignSubscription']);
            Route::get('/{id}', [AdminSubscriptionController::class, 'getSubscriptionById']);
            Route::patch('/{id}/status', [AdminSubscriptionController::class, 'updateSubscriptionStatus']);
            Route::patch('/{id}/extend', [AdminSubscriptionController::class, 'extendSubscription']);
        });

        // Collections
        Route::prefix('collections')->group(function () {
            Route::get('/stats', [AdminCollectionController::class, 'getCollectionStats']);
            Route::get('/', [AdminCollectionController::class, 'listCollections']);
        });

        // Email config
        Route::prefix('config/email')->group(function () {
            Route::get('/', [EmailConfigController::class, 'getEmailConfig']);
            Route::put('/', [EmailConfigController::class, 'updateEmailConfig']);
            Route::post('/test', [EmailConfigController::class, 'testEmailConfig']);
        });

        // Security config
        Route::prefix('config/security')->group(function () {
            Route::get('/', [SecurityConfigController::class, 'getSecurityConfig']);
            Route::put('/', [SecurityConfigController::class, 'updateSecurityConfig']);
        });

        // SMS config
        Route::prefix('config/sms')->group(function () {
            Route::get('/', [SmsConfigController::class, 'getSmsConfig']);
            Route::put('/', [SmsConfigController::class, 'updateSmsConfig']);
            Route::post('/test', [SmsConfigController::class, 'testSmsConfig']);
        });

        // Email templates
        Route::prefix('templates/email')->group(function () {
            Route::get('/', [EmailTemplateController::class, 'listEmailTemplates']);
            Route::get('/{key}', [EmailTemplateController::class, 'getEmailTemplate']);
            Route::put('/{key}', [EmailTemplateController::class, 'updateEmailTemplate']);
            Route::post('/{key}/preview', [EmailTemplateController::class, 'previewEmailTemplate']);
        });

        // SMS templates
        Route::prefix('templates/sms')->group(function () {
            Route::get('/', [SmsTemplateController::class, 'listSmsTemplates']);
            Route::get('/{key}', [SmsTemplateController::class, 'getSmsTemplate']);
            Route::put('/{key}', [SmsTemplateController::class, 'updateSmsTemplate']);
            Route::post('/{key}/preview', [SmsTemplateController::class, 'previewSmsTemplate']);
        });

        // Landing page
        Route::get('/landing-page', [AdminController::class, 'getLandingPageContent']);
        Route::put('/landing-page', [AdminController::class, 'updateLandingPageContent']);
        Route::post('/landing-page/publish', [AdminController::class, 'publishLandingPageContent']);
        Route::post('/landing-page/apk', [AdminController::class, 'uploadLandingPageApk']);

        // Email settings (legacy)
        Route::get('/email', [AdminController::class, 'getEmailSettings']);
        Route::put('/email/config', [AdminController::class, 'updateEmailConfig']);
        Route::put('/email/templates/{key}', [EmailTemplateController::class, 'updateEmailTemplate']);

        // SMS settings (legacy)
        Route::get('/sms', [AdminController::class, 'getSmsSettings']);
        Route::put('/sms/config', [AdminController::class, 'updateSmsConfig']);
        Route::put('/sms/templates/{key}', [AdminController::class, 'updateSmsTemplate']);
        Route::post('/sms/test', [AdminController::class, 'testSms']);

        // Security settings (legacy)
        Route::get('/security', [AdminController::class, 'getSecurityConfig']);
        Route::put('/security', [AdminController::class, 'updateSecurityConfig']);

        // Businesses
        Route::get('/businesses', [AdminController::class, 'listBusinesses']);
        Route::get('/businesses/{id}', [AdminController::class, 'getBusinessDetails']);
        Route::patch('/businesses/{businessId}/package', [AdminSubscriptionController::class, 'changeBusinessPackage']);

        // Audit logs
        Route::get('/audit-logs', [AdminController::class, 'listAuditLogs']);

        // Users
        Route::get('/users', [AdminController::class, 'listUsers']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::get('/users/{id}', [AdminController::class, 'getUserDetails']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::patch('/users/{id}/status', [AdminController::class, 'updateUserStatus']);
        Route::patch('/users/{id}/role', [AdminController::class, 'updateUserRole']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
    });
});
