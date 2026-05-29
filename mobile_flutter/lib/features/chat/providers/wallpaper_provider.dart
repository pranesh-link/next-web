import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _wallpaperKey = 'chat_wallpaper_color';

/// Notifier that manages chat wallpaper color via SharedPreferences.
class WallpaperNotifier extends StateNotifier<Color?> {
  WallpaperNotifier() : super(null) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getInt(_wallpaperKey);
    if (value != null) {
      state = Color(value);
    }
  }

  Future<void> setColor(Color? color) async {
    state = color;
    final prefs = await SharedPreferences.getInstance();
    if (color == null) {
      await prefs.remove(_wallpaperKey);
    } else {
      await prefs.setInt(_wallpaperKey, color.toARGB32());
    }
  }
}

/// Provides the current wallpaper color for the chat background.
final wallpaperProvider =
    StateNotifierProvider<WallpaperNotifier, Color?>((ref) {
  return WallpaperNotifier();
});
