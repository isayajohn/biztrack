import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/api/api_client.dart';
import 'core/api/inventory_api.dart';
import 'core/models/expense.dart';
import 'core/models/product.dart';
import 'core/models/sale.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/expense_provider.dart';
import 'providers/inventory_provider.dart';
import 'providers/product_provider.dart';
import 'providers/sale_provider.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/expenses/expense_form_screen.dart';
import 'screens/expenses/expenses_screen.dart';
import 'screens/home/home_shell.dart';
import 'screens/inventory/low_stock_screen.dart';
import 'screens/inventory/stock_in_screen.dart';
import 'screens/inventory/stock_movements_screen.dart';
import 'screens/inventory/suppliers_screen.dart';
import 'screens/notifications/notifications_screen.dart';
import 'screens/products/product_form_screen.dart';
import 'screens/products/products_screen.dart';
import 'screens/reports/reports_screen.dart';
import 'screens/sales/sale_form_screen.dart';
import 'screens/sales/sales_screen.dart';
import 'screens/settings/settings_screen.dart';
import 'screens/admin_restricted_screen.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const BizTrackApp());
}

class BizTrackApp extends StatefulWidget {
  const BizTrackApp({super.key});

  @override
  State<BizTrackApp> createState() => _BizTrackAppState();
}

class _BizTrackAppState extends State<BizTrackApp> {
  final _apiClient = ApiClient();
  late final AuthProvider _authProvider;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider(_apiClient);

    _router = GoRouter(
      initialLocation: '/splash',
      refreshListenable: _authProvider,
      redirect: (context, state) {
        final isAuth = _authProvider.isAuthenticated;
        final status = _authProvider.status;
        final role = _authProvider.user?.role ?? '';
        final loc = state.matchedLocation;

        if (status == AuthStatus.unknown) {
          return loc == '/splash' ? null : '/splash';
        }

        final isAuthRoute = loc == '/login' ||
            loc == '/register' ||
            loc == '/forgot-password';

        if (!isAuth && !isAuthRoute && loc != '/splash') {
          return '/login';
        }
        if (isAuth && (isAuthRoute || loc == '/splash')) {
          return role == 'SUPER_ADMIN' ? '/admin-restricted' : '/';
        }
        // Block SUPER_ADMIN from all business routes
        if (isAuth && role == 'SUPER_ADMIN' && loc != '/admin-restricted') {
          return '/admin-restricted';
        }
        return null;
      },
      routes: [
        GoRoute(
          path: '/splash',
          builder: (_, __) => const SplashScreen(),
        ),
        GoRoute(
          path: '/admin-restricted',
          builder: (_, __) => const AdminRestrictedScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (_, __) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (_, __) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/forgot-password',
          builder: (_, __) => const ForgotPasswordScreen(),
        ),

        // Main shell with bottom nav — 5 branches
        StatefulShellRoute.indexedStack(
          builder: (_, __, shell) => HomeShell(navigationShell: shell),
          branches: [
            // Branch 0: Dashboard
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/',
                  builder: (_, __) => const DashboardScreen(),
                ),
              ],
            ),
            // Branch 1: Sales
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/sales',
                  builder: (_, __) => const SalesScreen(),
                ),
              ],
            ),
            // Branch 2: Expenses
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/expenses',
                  builder: (_, __) => const ExpensesScreen(),
                ),
              ],
            ),
            // Branch 3: Products
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/products',
                  builder: (_, __) => const ProductsScreen(),
                ),
              ],
            ),
            // Branch 4: Settings + Reports
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/settings',
                  builder: (_, __) => const SettingsScreen(),
                ),
              ],
            ),
          ],
        ),

        // Modal / overlay routes outside the shell
        GoRoute(
          path: '/sales/add',
          builder: (_, __) => const SaleFormScreen(),
        ),
        GoRoute(
          path: '/sales/edit/:id',
          builder: (ctx, state) {
            final sale = state.extra as Sale?;
            return SaleFormScreen(sale: sale);
          },
        ),
        GoRoute(
          path: '/expenses/add',
          builder: (_, __) => const ExpenseFormScreen(),
        ),
        GoRoute(
          path: '/expenses/edit/:id',
          builder: (ctx, state) {
            final expense = state.extra as Expense?;
            return ExpenseFormScreen(expense: expense);
          },
        ),
        GoRoute(
          path: '/products/add',
          builder: (_, __) => const ProductFormScreen(),
        ),
        GoRoute(
          path: '/products/edit/:id',
          builder: (ctx, state) {
            final product = state.extra as Product?;
            return ProductFormScreen(product: product);
          },
        ),
        GoRoute(
          path: '/reports',
          builder: (_, __) => const ReportsScreen(),
        ),

        // Inventory routes
        GoRoute(
          path: '/inventory/low-stock',
          builder: (_, __) => const LowStockScreen(),
        ),
        GoRoute(
          path: '/inventory/stock-in',
          builder: (_, __) => const StockInScreen(),
        ),
        GoRoute(
          path: '/inventory/movements',
          builder: (_, __) => const StockMovementsScreen(),
        ),
        GoRoute(
          path: '/inventory/suppliers',
          builder: (_, __) => const SuppliersScreen(),
        ),
        GoRoute(
          path: '/notifications',
          builder: (_, __) => const NotificationsScreen(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authProvider),
        Provider.value(value: _apiClient),
        ChangeNotifierProvider(
          create: (_) => SaleProvider(_apiClient),
        ),
        ChangeNotifierProvider(
          create: (_) => ExpenseProvider(_apiClient),
        ),
        ChangeNotifierProvider(
          create: (_) => ProductProvider(_apiClient),
        ),
        ChangeNotifierProvider(
          create: (_) => InventoryProvider(InventoryApi(_apiClient)),
        ),
      ],
      child: MaterialApp.router(
        title: 'BizTrack',
        theme: buildAppTheme(),
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
