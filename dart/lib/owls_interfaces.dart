/// Deserialize only after validating the release JSON Schema and host invariants.
class WasmAsset {
  final String id, url, kind, sha256;
  final int bytes;
  final bool prepare;
  const WasmAsset(
      {required this.id,
      required this.url,
      required this.kind,
      required this.sha256,
      required this.bytes,
      required this.prepare});
  factory WasmAsset.fromJson(Map<String, dynamic> json) => WasmAsset(
      id: json['id'] as String,
      url: json['url'] as String,
      kind: json['kind'] as String,
      sha256: json['sha256'] as String,
      bytes: (json['bytes'] as num).toInt(),
      prepare: json['prepare'] as bool);
}

class WasmRelease {
  final int schemaVersion;
  final String appId, release, runtime, entrypoint;
  final List<WasmAsset> assets;
  final Map<String, Object?> extensions;
  WasmRelease(
      {required this.schemaVersion,
      required this.appId,
      required this.release,
      required this.runtime,
      required this.entrypoint,
      required List<WasmAsset> assets,
      Map<String, Object?> extensions = const {}})
      : assets = List.unmodifiable(assets),
        extensions = _immutableJson(extensions) as Map<String, Object?>;
  factory WasmRelease.fromJson(Map<String, dynamic> json) => WasmRelease(
      schemaVersion: (json['schemaVersion'] as num).toInt(),
      appId: json['appId'] as String,
      release: json['release'] as String,
      runtime: json['runtime'] as String,
      entrypoint: json['entrypoint'] as String,
      extensions: (json['extensions'] as Map<String, dynamic>?) ?? const {},
      assets: (json['assets'] as List)
          .map((v) => WasmAsset.fromJson(v as Map<String, dynamic>))
          .toList());
}

Object? _immutableJson(Object? value) {
  if (value is Map<String, dynamic>)
    return Map<String, Object?>.unmodifiable(
        value.map((k, v) => MapEntry(k, _immutableJson(v))));
  if (value is List)
    return List<Object?>.unmodifiable(value.map(_immutableJson));
  return value;
}
