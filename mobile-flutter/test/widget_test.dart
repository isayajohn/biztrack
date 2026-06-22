import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_flutter/main.dart';

void main() {
  testWidgets('BizTrack app starts', (WidgetTester tester) async {
    await tester.pumpWidget(const BizTrackApp());
    await tester.pump();

    expect(find.text('BizTrack'), findsWidgets);
  });
}
