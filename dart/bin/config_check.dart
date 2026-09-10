import '../lib/owls_config.dart';

Never fail(String message) => throw StateError(message);

void expectWire(Object? actual, Object? expected, String label) {
  if (actual != expected) {
    fail('$label: got $actual, want $expected');
  }
}

void main() {
  expectWire(ConfigVersion.v1.wire, 1, 'ConfigVersion.v1');

  final hostKinds = <HostKind, String>{
    HostKind.browser: 'browser',
    HostKind.ssr: 'ssr',
    HostKind.worker: 'worker',
    HostKind.rustNative: 'rust-native',
    HostKind.flutter: 'flutter',
  };
  for (final entry in hostKinds.entries) {
    expectWire(entry.key.wire, entry.value, 'HostKind.${entry.key.name}');
  }

  final prepareTriggers = <PrepareTrigger, String>{
    PrepareTrigger.explicit: 'explicit',
    PrepareTrigger.intent: 'intent',
    PrepareTrigger.idle: 'idle',
    PrepareTrigger.disabled: 'disabled',
  };
  for (final entry in prepareTriggers.entries) {
    expectWire(
      entry.key.wire,
      entry.value,
      'PrepareTrigger.${entry.key.name}',
    );
  }

  final prepareStages = <ConfigPrepareStage, String>{
    ConfigPrepareStage.fetch: 'fetch',
    ConfigPrepareStage.compile: 'compile',
  };
  for (final entry in prepareStages.entries) {
    expectWire(
      entry.key.wire,
      entry.value,
      'ConfigPrepareStage.${entry.key.name}',
    );
  }

  final activationPolicies = <ActivationPolicy, String>{
    ActivationPolicy.explicit: 'explicit',
    ActivationPolicy.route: 'route',
    ActivationPolicy.startup: 'startup',
    ActivationPolicy.disabled: 'disabled',
  };
  for (final entry in activationPolicies.entries) {
    expectWire(
      entry.key.wire,
      entry.value,
      'ActivationPolicy.${entry.key.name}',
    );
  }

  final envTypes = <EnvValueType, String>{
    EnvValueType.string: 'string',
    EnvValueType.integer: 'integer',
    EnvValueType.bool: 'bool',
    EnvValueType.doubleValue: 'double',
    EnvValueType.json: 'json',
    EnvValueType.array: 'array',
    EnvValueType.map: 'map',
  };
  for (final entry in envTypes.entries) {
    expectWire(entry.key.wire, entry.value, 'EnvValueType.${entry.key.name}');
  }

  final config = OresWasmConfig(
    version: ConfigVersion.v1,
    enabled: true,
    strict: true,
    hosts: {
      'browser': HostConfig(
        kind: HostKind.browser,
        root: './dist',
        releaseManifest: './dist/release.json',
        allowedOrigins: ['https://example.test'],
        prepare: const ConfigPrepare(
          trigger: PrepareTrigger.intent,
          maxBytes: 8388608,
          maxConcurrency: 4,
          furthestStage: ConfigPrepareStage.compile,
        ),
        activation: const ConfigActivation(policy: ActivationPolicy.explicit),
      ),
    },
    env: {
      'feature': const EnvDeclaration(
        env: 'OWLS_FEATURE',
        type: EnvValueType.bool,
        target: 'browser',
        required: true,
      ),
    },
    extensions: {'owner': 'DEN-3959'},
  );

  expectWire(
    config.hosts['browser']?.kind.wire,
    'browser',
    'OresWasmConfig.hosts.browser.kind',
  );
  expectWire(
    config.env?['feature']?.type.wire,
    'bool',
    'OresWasmConfig.env.feature.type',
  );

  var hostsAreImmutable = false;
  try {
    config.hosts['other'] = config.hosts['browser']!;
  } on UnsupportedError {
    hostsAreImmutable = true;
  }
  if (!hostsAreImmutable) {
    fail('OresWasmConfig.hosts must be immutable');
  }

  var allowedOriginsAreImmutable = false;
  try {
    config.hosts['browser']!.allowedOrigins!.add('https://other.example');
  } on UnsupportedError {
    allowedOriginsAreImmutable = true;
  }
  if (!allowedOriginsAreImmutable) {
    fail('HostConfig.allowedOrigins must be immutable');
  }
}
