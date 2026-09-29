import 'package:flutter/material.dart';

// Shared portal palette. The legacy *Green names remain as aliases so existing
// screens inherit the refreshed theme without duplicating color values.
const kPrimary = Color(0xFFE60023);
const kPrimaryPressed = Color(0xFFCC001F);
const kInk = Color(0xFF000000);
const kInkSoft = Color(0xFF211922);
const kBody = Color(0xFF33332E);
const kMuted = Color(0xFF62625B);
const kAsh = Color(0xFF91918C);
const kStone = Color(0xFFC8C8C1);
const kHairline = Color(0xFFDADAD3);
const kHairlineSoft = Color(0xFFE5E5E0);
const kSurfaceSoft = Color(0xFFFBFBF9);
const kSurfaceCard = Color(0xFFF6F6F3);
const kFocus = Color(0xFF435EE5);
const kSuccess = Color(0xFF103C25);
const kSuccessPale = Color(0xFFC7F0DA);
const kError = Color(0xFF9E0A0A);

const kPrimaryGreen = kPrimary;
const kSecondaryGreen = kPrimaryPressed;
const kLightGreen = kSurfaceCard;
const kDark = kInkSoft;
const kBg = kSurfaceSoft;
const kSun = Color(0xFFF59E0B);
const kClay = Color(0xFFB45309);

// The UI uses 16px controls/cards, 32px modals, and pill-shaped chips.
const kCardBorder = kHairlineSoft;
const kBadgeAlpha = 0.10;

// API host selection:
//   Production/default           → deployed BizTrack API
//   Android emulator            → flutter run --dart-define=BIZTRACK_API_BASE_URL=http://10.0.2.2:8002/api
//   iOS simulator               → flutter run --dart-define=BIZTRACK_API_BASE_URL=http://127.0.0.1:8002/api
const _kProductionApiBaseUrl = 'https://biztracktanzania.online/api';

String get kApiBaseUrl {
  const override = String.fromEnvironment('BIZTRACK_API_BASE_URL');
  if (override.isNotEmpty) return override;
  return _kProductionApiBaseUrl;
}

ThemeData buildAppTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: kPrimary,
      onPrimary: Colors.white,
      primaryContainer: kSurfaceCard,
      onPrimaryContainer: kInk,
      secondary: kInk,
      onSecondary: Colors.white,
      secondaryContainer: kHairlineSoft,
      onSecondaryContainer: kInk,
      surface: Colors.white,
      onSurface: kBody,
      error: kError,
      onError: Colors.white,
      outline: kAsh,
      outlineVariant: kHairline,
    ),
    scaffoldBackgroundColor: kBg,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: kInk,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      toolbarHeight: 64,
      shape: Border(bottom: BorderSide(color: kHairline)),
      titleTextStyle: TextStyle(
        color: kInk,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
        disabledBackgroundColor: kSurfaceCard,
        disabledForegroundColor: kAsh,
        minimumSize: const Size.fromHeight(48),
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kInk,
        backgroundColor: kHairlineSoft,
        side: const BorderSide(color: Colors.transparent),
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: kInk,
        minimumSize: const Size(44, 44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kAsh),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kAsh),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kFocus, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kError),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kError, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      labelStyle: const TextStyle(color: kMuted),
      hintStyle: const TextStyle(color: kAsh),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: kCardBorder),
      ),
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 0),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 16,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: kPrimary,
      foregroundColor: Colors.white,
      elevation: 0,
      focusElevation: 0,
      hoverElevation: 0,
      highlightElevation: 0,
      shape: CircleBorder(),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      selectedItemColor: kPrimary,
      unselectedItemColor: kMuted,
      backgroundColor: Colors.white,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
      unselectedLabelStyle: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w500,
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: kSurfaceCard,
      selectedColor: kInk,
      disabledColor: kSurfaceCard,
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
      secondaryLabelStyle: const TextStyle(
        color: Colors.white,
        fontSize: 12,
        fontWeight: FontWeight.w700,
      ),
      side: BorderSide.none,
      shape: const StadiumBorder(),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    ),
    dividerTheme: const DividerThemeData(
      color: kHairline,
      thickness: 1,
      space: 1,
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      modalBackgroundColor: Colors.white,
      modalElevation: 16,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
    ),
    popupMenuTheme: const PopupMenuThemeData(
      color: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 16,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(32)),
      ),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: kPrimary),
    textSelectionTheme: const TextSelectionThemeData(
      cursorColor: kPrimary,
      selectionColor: kSuccessPale,
      selectionHandleColor: kPrimary,
    ),
    snackBarTheme: const SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: Color(0xFF262622),
      contentTextStyle: TextStyle(color: Colors.white),
    ),
  );

  return base.copyWith(
    textTheme: base.textTheme.copyWith(
      headlineLarge: const TextStyle(
        color: kInk,
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.2,
      ),
      headlineMedium: const TextStyle(
        color: kInk,
        fontSize: 22,
        fontWeight: FontWeight.w600,
      ),
      headlineSmall: const TextStyle(
        color: kInk,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      titleLarge: const TextStyle(
        color: kInk,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      titleMedium: const TextStyle(
        color: kInk,
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: const TextStyle(color: kBody, fontSize: 16, height: 1.4),
      bodyMedium: const TextStyle(color: kBody, fontSize: 14, height: 1.4),
      bodySmall: const TextStyle(color: kMuted, fontSize: 12, height: 1.4),
      labelLarge: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
    ),
  );
}
