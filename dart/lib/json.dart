/// JSON decoding boundary for the immutable OWLS release projection.
///
/// JSON Schema's `integer` vocabulary accepts values such as `2.0`. Dart's
/// `jsonDecode` normally produces an `int` for integral tokens, but other JSON
/// decoders and in-memory callers may represent the same JSON number as a
/// `double`. Normalize only the fields declared as integers by the peer
/// TypeSpec/JSON Schema contract, without mutating the caller's document.
library;

import 'owls_interfaces.dart';

const int _maxExactJsonInteger = 9007199254740991;

int _jsonInteger(Object? value, String path) {
  if (value is int) return value;
  if (value is double &&
      value.isFinite &&
      value.abs() <= _maxExactJsonInteger &&
      value == value.truncateToDouble()) {
    return value.toInt();
  }
  throw FormatException('$path must be an integer-valued JSON number');
}

Map<String, dynamic> _objectCopy(Object? value, String path) {
  if (value is! Map) throw FormatException('$path must be an object');
  final result = <String, dynamic>{};
  for (final entry in value.entries) {
    if (entry.key is! String) {
      throw FormatException('$path contains a non-string JSON key');
    }
    result[entry.key as String] = entry.value;
  }
  return result;
}

/// Return a detached release document with contract-declared integer fields
/// represented as Dart `int` values.
Map<String, dynamic> normalizeWasmReleaseJson(Object? value) {
  final release = _objectCopy(value, r'$');
  if (release.containsKey('schemaVersion')) {
    release['schemaVersion'] =
        _jsonInteger(release['schemaVersion'], r'$.schemaVersion');
  }

  final assets = release['assets'];
  if (assets is List) {
    release['assets'] = List<dynamic>.generate(assets.length, (index) {
      final asset = _objectCopy(assets[index], r'$.assets[]');
      if (asset.containsKey('bytes')) {
        asset['bytes'] =
            _jsonInteger(asset['bytes'], r'$.assets[].bytes');
      }
      return asset;
    }, growable: false);
  }

  final budget = release['prepareBudget'];
  if (budget != null) {
    final normalized = _objectCopy(budget, r'$.prepareBudget');
    for (final field in const ['maxBytes', 'maxConcurrency']) {
      if (normalized.containsKey(field)) {
        normalized[field] = _jsonInteger(
          normalized[field],
          r'$.prepareBudget.' + field,
        );
      }
    }
    release['prepareBudget'] = normalized;
  }

  return release;
}

/// Parse a decoded JSON release through the canonical Dart projection after
/// JSON-number normalization.
WasmRelease parseWasmReleaseJson(Object? value) =>
    WasmRelease.fromJson(normalizeWasmReleaseJson(value));
