import 'package:flutter/foundation.dart';

/// Authenticated user profile.
@immutable
class User {
  final String id;
  final String name;
  final String email;
  final String? image;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.image,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      image: json['image'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'image': image,
    };
  }
}
