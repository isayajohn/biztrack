# BizTrack Mobile

The app uses the deployed BizTrack API by default:

```text
https://snow-aardvark-815146.hostingersite.com/api
```

For local development, override it at build or run time:

```bash
flutter run --dart-define=BIZTRACK_API_BASE_URL=http://10.0.2.2:8002/api
```

Use `127.0.0.1` instead of `10.0.2.2` for the iOS simulator.

## Run

```bash
flutter pub get
flutter run
```
