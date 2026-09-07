import 'dart:convert';
import 'dart:io';

import 'package:owls_interfaces/owls_interfaces.dart';

bool deepEqual(Object? left, Object? right) {
  if (identical(left, right) || left == right) return true;
  if (left is List && right is List) {
    return left.length == right.length &&
        Iterable<int>.generate(left.length)
            .every((index) => deepEqual(left[index], right[index]));
  }
  if (left is Map && right is Map) {
    return left.length == right.length &&
        left.keys.every(
          (key) => right.containsKey(key) && deepEqual(left[key], right[key]),
        );
  }
  return false;
}

Never fail(String message) => throw StateError(message);

Future<void> main() async {
  final directory = Directory('../fixtures/valid');
  final fixtures = directory
      .listSync()
      .whereType<File>()
      .where((file) => file.path.endsWith('.json'))
      .toList()
    ..sort((left, right) => left.path.compareTo(right.path));
  if (fixtures.length < 4) fail('expected the shared release fixture corpus');

  var sawV1 = false;
  var sawV2 = false;
  for (final fixture in fixtures) {
    final decoded = jsonDecode(await fixture.readAsString());
    if (decoded is! Map<String, dynamic>) {
      fail('${fixture.path}: root must be an object');
    }
    final release = WasmRelease.fromJson(decoded);
    sawV1 = sawV1 || release.schemaVersion == 1;
    sawV2 = sawV2 || release.schemaVersion == 2;
    if (!deepEqual(decoded, release.toJson())) {
      fail('${fixture.path}: projection round trip changed the document');
    }
    try {
      release.assets.clear();
      fail('${fixture.path}: assets are mutable');
    } on UnsupportedError {
      // Expected.
    }
  }
  if (!sawV1 || !sawV2) fail('both schema generations must remain consumable');

  final extensionProbe = WasmRelease.fromJson({
    'schemaVersion': 2,
    'appId': 'extension-probe',
    'release': 'r1',
    'runtime': 'raw-wasm',
    'entrypoint': 'main',
    'assets': [
      {
        'id': 'main',
        'url': 'https://assets.example/main.wasm',
        'kind': 'wasm',
        'bytes': 8,
        'sha256': List.filled(64, '0').join(),
        'prepare': true,
      },
    ],
    'extensions': {
      'nested': [
        {'enabled': true}
      ]
    },
  });
  try {
    extensionProbe.extensions['mutate'] = true;
    fail('extensions are mutable');
  } on UnsupportedError {
    // Expected.
  }

  try {
    RuntimeKind.fromWire('unknown-runtime');
    fail('unknown runtime was accepted');
  } on FormatException {
    // Expected.
  }

  stdout.writeln('PASS: ${fixtures.length} Dart release fixtures round-tripped');
}
