// File generated manually from google-services.json and GoogleService-Info.plist.
// To regenerate: flutterfire configure --project=luvverse-pranaish

// ignore_for_file: lines_longer_than_80_chars, avoid_classes_with_only_static_members
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web - '
        'you can reconfigure this by running the FlutterFire CLI again.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBeM2oph-1wEc6V6HANi8aZUaTGq4SfA88',
    appId: '1:613218271037:android:1037ba7132fb6bf70ecf54',
    messagingSenderId: '613218271037',
    projectId: 'luvverse-pranaish',
    storageBucket: 'luvverse-pranaish.firebasestorage.app',
  );
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCSrMbeK5sR5ICG3wC21yEnDAwjqnG4a1I',
    appId: '1:613218271037:ios:184c0bfa4075ec500ecf54',
    messagingSenderId: '613218271037',
    projectId: 'luvverse-pranaish',
    storageBucket: 'luvverse-pranaish.firebasestorage.app',
    androidClientId: '613218271037-8g6oaitfvi61gce8u8lkuka803lb2re5.apps.googleusercontent.com',
    iosClientId: '613218271037-f8n7hrmek69lde0s0o7cnu46vv2hg6qe.apps.googleusercontent.com',
    iosBundleId: 'link.pranaish.luvverse',
  );
}
