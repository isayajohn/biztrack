import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/models/inventory_notification.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/inventory_provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _unreadOnly = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InventoryProvider>().fetchNotifications(
            unreadOnly: _unreadOnly,
          );
    });
  }

  Future<void> _refresh() =>
      context.read<InventoryProvider>().fetchNotifications(
            unreadOnly: _unreadOnly,
          );

  void _setFilter(bool unreadOnly) {
    if (_unreadOnly == unreadOnly) return;
    setState(() => _unreadOnly = unreadOnly);
    context.read<InventoryProvider>().fetchNotifications(
          unreadOnly: unreadOnly,
        );
  }

  Future<void> _markAllRead() async {
    await context.read<InventoryProvider>().markAllRead();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All notifications marked as read'),
        backgroundColor: kPrimaryGreen,
      ),
    );
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'LOW_STOCK':
        return Icons.warning_amber_rounded;
      case 'STOCK_IN':
        return Icons.add_circle_outline_rounded;
      case 'STOCK_OUT':
      case 'SALE':
        return Icons.remove_circle_outline_rounded;
      case 'EXPIRY':
      case 'EXPIRED':
        return Icons.schedule_rounded;
      case 'PURCHASE':
        return Icons.shopping_cart_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'LOW_STOCK':
        return Colors.orange.shade600;
      case 'STOCK_IN':
      case 'PURCHASE':
        return const Color(0xFF10B981);
      case 'STOCK_OUT':
      case 'SALE':
        return const Color(0xFF3B82F6);
      case 'EXPIRY':
      case 'EXPIRED':
        return Colors.red.shade600;
      default:
        return kMuted;
    }
  }

  String _timeAgo(String raw) {
    if (raw.isEmpty) return '';
    try {
      final dt = DateTime.parse(raw).toLocal();
      final diff = DateTime.now().difference(dt);
      if (diff.inSeconds < 60) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
      return '${(diff.inDays / 30).floor()}mo ago';
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Consumer<InventoryProvider>(
          builder: (_, provider, __) {
            final unread = provider.unreadCount;
            return Row(
              children: [
                const Text('Notifications'),
                if (unread > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.red.shade500,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$unread',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ],
            );
          },
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          Consumer<InventoryProvider>(
            builder: (_, provider, __) => provider.unreadCount > 0
                ? TextButton(
                    onPressed: _markAllRead,
                    child: const Text(
                      'Mark all read',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter pills
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                _FilterPill(
                  label: 'All',
                  selected: !_unreadOnly,
                  onTap: () => _setFilter(false),
                ),
                const SizedBox(width: 8),
                _FilterPill(
                  label: 'Unread',
                  selected: _unreadOnly,
                  onTap: () => _setFilter(true),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          // List
          Expanded(
            child: Consumer<InventoryProvider>(
              builder: (context, provider, _) {
                if (provider.notifications.isEmpty &&
                    provider.loading) {
                  return const Center(
                    child:
                        CircularProgressIndicator(color: kPrimaryGreen),
                  );
                }

                final items = _unreadOnly
                    ? provider.notifications
                        .where((n) => !n.isRead)
                        .toList()
                    : provider.notifications;

                if (items.isEmpty) {
                  return RefreshIndicator(
                    onRefresh: _refresh,
                    color: kPrimaryGreen,
                    child: ListView(
                      children: [
                        const SizedBox(height: 100),
                        Center(
                          child: Column(
                            children: [
                              Icon(
                                Icons.notifications_none_rounded,
                                size: 64,
                                color: kMuted.withValues(alpha: 0.5),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _unreadOnly
                                    ? 'No unread notifications'
                                    : 'No notifications',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: kDark,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _unreadOnly
                                    ? "You're all caught up!"
                                    : 'Notifications will appear here.',
                                style: const TextStyle(color: kMuted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: _refresh,
                  color: kPrimaryGreen,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: items.length,
                    separatorBuilder: (_, __) =>
                        const Divider(height: 1, indent: 70),
                    itemBuilder: (_, i) {
                      final n = items[i];
                      return _NotificationTile(
                        notification: n,
                        icon: _typeIcon(n.type),
                        color: _typeColor(n.type),
                        timeAgo: _timeAgo(n.createdAt),
                        onTap: () {
                          if (!n.isRead) {
                            context
                                .read<InventoryProvider>()
                                .markRead(n.id);
                          }
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final InventoryNotification notification;
  final IconData icon;
  final Color color;
  final String timeAgo;
  final VoidCallback onTap;

  const _NotificationTile({
    required this.notification,
    required this.icon,
    required this.color,
    required this.timeAgo,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isUnread = !notification.isRead;

    return InkWell(
      onTap: onTap,
      child: Container(
        color: isUnread
            ? kPrimaryGreen.withValues(alpha: 0.04)
            : Colors.transparent,
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontWeight: isUnread
                                ? FontWeight.w700
                                : FontWeight.w500,
                            fontSize: 14,
                            color: isUnread ? kDark : kMuted,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        timeAgo,
                        style: const TextStyle(
                            color: kMuted, fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    notification.message,
                    style: TextStyle(
                      color: isUnread ? kDark.withValues(alpha: 0.75) : kMuted,
                      fontSize: 13,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (isUnread) ...[
              const SizedBox(width: 8),
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 4),
                decoration: BoxDecoration(
                  color: kPrimaryGreen,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterPill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? kPrimaryGreen : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? kPrimaryGreen : const Color(0xFFE5E7EB),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : kMuted,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
