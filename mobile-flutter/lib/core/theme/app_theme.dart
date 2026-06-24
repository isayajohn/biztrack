import 'package:flutter/material.dart';

const kPrimaryGreen = Color(0xFF2D7A4F);
const kLightGreen = Color(0xFFE8F5EE);
const kDark = Color(0xFF1A1F1E);
const kBg = Color(0xFFF7F5EE);
const kMuted = Color(0xFF6B7280);

// API host selection:
//   Physical Android/iOS device → uses Mac mDNS hostname (works on any network, never changes)
//   Android emulator            → flutter run --dart-define=BIZTRACK_API_BASE_URL=http://10.0.2.2:8000/api
//   iOS simulator               → flutter run --dart-define=BIZTRACK_API_BASE_URL=http://127.0.0.1:8000/api
const _kMdnsHost = 'Isayas-MacBook-Pro.local'; // Mac mDNS hostname — always works on same WiFi

String get kApiBaseUrl {
  const override = String.fromEnvironment('BIZTRACK_API_BASE_URL');
  if (override.isNotEmpty) return override;
  return 'http://$_kMdnsHost:8000/api';
}

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: kPrimaryGreen,
      primary: kPrimaryGreen,
      onPrimary: Colors.white,
      surface: kBg,
      onSurface: kDark,
    ),
    scaffoldBackgroundColor: kBg,
    appBarTheme: const AppBarTheme(
      backgroundColor: kPrimaryGreen,
      foregroundColor: Colors.white,
      elevation: 0,
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.3,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kPrimaryGreen,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kPrimaryGreen,
        side: const BorderSide(color: kPrimaryGreen),
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kPrimaryGreen, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      labelStyle: const TextStyle(color: kMuted),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 0),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: kPrimaryGreen,
      foregroundColor: Colors.white,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      selectedItemColor: kPrimaryGreen,
      unselectedItemColor: kMuted,
      backgroundColor: Colors.white,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    chipTheme: ChipThemeData(
      selectedColor: kPrimaryGreen,
      labelStyle: const TextStyle(fontSize: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
  );
}
