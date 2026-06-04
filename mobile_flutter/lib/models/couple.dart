import 'package:flutter/foundation.dart';

import 'user.dart';

/// Couple member roles.
abstract class CoupleRole {
  static const owner = 'OWNER';
  static const partner = 'PARTNER';
}

/// A couple group linking two users for shared finance.
@immutable
class Couple {
  final String id;
  final String? name;
  final List<CoupleMember> members;
  final DateTime createdAt;

  const Couple({
    required this.id,
    this.name,
    required this.members,
    required this.createdAt,
  });

  factory Couple.fromJson(Map<String, dynamic> json) {
    return Couple(
      id: json['id'] as String,
      name: json['name'] as String?,
      members: (json['members'] as List<dynamic>)
          .map((e) => CoupleMember.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'members': members.map((e) => e.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

/// A member within a couple group.
@immutable
class CoupleMember {
  final String id;
  final String userId;
  final String role;
  final User user;

  const CoupleMember({
    required this.id,
    required this.userId,
    required this.role,
    required this.user,
  });

  factory CoupleMember.fromJson(Map<String, dynamic> json) {
    return CoupleMember(
      id: json['id'] as String,
      userId: json['userId'] as String,
      role: json['role'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'role': role,
      'user': user.toJson(),
    };
  }
}
