class DebtReminder {
  final String id;
  final String debtId;
  final String channel;
  final String triggerType;
  final String status;
  final String? scheduledFor;
  final String? sentAt;
  final String? failureReason;

  DebtReminder({
    required this.id,
    required this.debtId,
    required this.channel,
    required this.triggerType,
    required this.status,
    this.scheduledFor,
    this.sentAt,
    this.failureReason,
  });

  factory DebtReminder.fromJson(Map<String, dynamic> json) => DebtReminder(
    id: json['id']?.toString() ?? '',
    debtId: json['debtId']?.toString() ?? '',
    channel: json['channel']?.toString() ?? 'IN_APP',
    triggerType: json['triggerType']?.toString() ?? 'MANUAL',
    status: json['status']?.toString() ?? 'PENDING',
    scheduledFor: json['scheduledFor']?.toString(),
    sentAt: json['sentAt']?.toString(),
    failureReason: json['failureReason']?.toString(),
  );

  static const List<String> channels = ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'];
}
