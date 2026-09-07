/// Downstream immutable wire projections for the shared WASM release contract.
/// TypeSpec and authored JSON Schema remain independent peer authorities.

T _enumFromWire<T>(
  Object? value,
  List<T> values,
  String Function(T value) wire,
  String name,
) {
  if (value is! String) {
    throw FormatException('$name must be a string');
  }
  for (final candidate in values) {
    if (wire(candidate) == value) return candidate;
  }
  throw FormatException('Unknown $name: $value');
}

// @contract-ir SchemaVersion enum 1|2
enum SchemaVersion {
  v1(1),
  v2(2);

  const SchemaVersion(this.wire);
  final int wire;

  static SchemaVersion fromWire(Object? value) {
    for (final candidate in values) {
      if (candidate.wire == value) return candidate;
    }
    throw FormatException('Unknown SchemaVersion: $value');
  }
}

// @contract-ir RuntimeKind enum flutter-web|raw-wasm|wasm-bindgen
enum RuntimeKind {
  rawWasm('raw-wasm'),
  wasmBindgen('wasm-bindgen'),
  flutterWeb('flutter-web');

  const RuntimeKind(this.wire);
  final String wire;
  static RuntimeKind fromWire(Object? value) =>
      _enumFromWire(value, values, (entry) => entry.wire, 'RuntimeKind');
}

// @contract-ir FrameworkKind enum dioxus|flutter|leptos|none
enum FrameworkKind {
  none('none'),
  leptos('leptos'),
  dioxus('dioxus'),
  flutter('flutter');

  const FrameworkKind(this.wire);
  final String wire;
  static FrameworkKind fromWire(Object? value) =>
      _enumFromWire(value, values, (entry) => entry.wire, 'FrameworkKind');
}

// @contract-ir AssetKind enum data|font|module|script|wasm
enum AssetKind {
  wasm('wasm'),
  module('module'),
  script('script'),
  data('data'),
  font('font');

  const AssetKind(this.wire);
  final String wire;
  static AssetKind fromWire(Object? value) =>
      _enumFromWire(value, values, (entry) => entry.wire, 'AssetKind');
}

// @contract-ir AssetRole enum asset|bootstrap|chunk|fallback|glue|module
enum AssetRole {
  bootstrap('bootstrap'),
  glue('glue'),
  module('module'),
  fallback('fallback'),
  chunk('chunk'),
  asset('asset');

  const AssetRole(this.wire);
  final String wire;
  static AssetRole fromWire(Object? value) =>
      _enumFromWire(value, values, (entry) => entry.wire, 'AssetRole');
}

// @contract-ir AssetStage enum critical|lazy|optional
enum AssetStage {
  critical('critical'),
  optional('optional'),
  lazy('lazy');

  const AssetStage(this.wire);
  final String wire;
  static AssetStage fromWire(Object? value) =>
      _enumFromWire(value, values, (entry) => entry.wire, 'AssetStage');
}

// @contract-ir PrepareStage enum compile|fetch
enum PrepareStage {
  fetch('fetch'),
  compile('compile');

  const PrepareStage(this.wire);
  final String wire;
  static PrepareStage fromWire(Object? value) =>
      _enumFromWire(value, values, (entry) => entry.wire, 'PrepareStage');
}

// @contract-ir ActivationMode enum attach-view|hydrate-islands|mount-route|run-app
enum ActivationMode {
  attachView('attach-view'),
  hydrateIslands('hydrate-islands'),
  mountRoute('mount-route'),
  runApp('run-app');

  const ActivationMode(this.wire);
  final String wire;
  static ActivationMode fromWire(Object? value) =>
      _enumFromWire(value, values, (entry) => entry.wire, 'ActivationMode');
}

// @contract-ir AssetId scalar-like
typedef AssetId = String;
// @contract-ir HttpsAssetUrl scalar-like
typedef HttpsAssetUrl = String;
// @contract-ir Sha256Hex scalar-like
typedef Sha256Hex = String;
// @contract-ir ApplicationId scalar-like
typedef ApplicationId = String;
// @contract-ir ReleaseId scalar-like
typedef ReleaseId = String;
// @contract-ir ToolchainId scalar-like
typedef ToolchainId = String;
// @contract-ir EntrypointId scalar-like
typedef EntrypointId = String;
// @contract-ir HostSelector scalar-like
typedef HostSelector = String;
// @contract-ir IslandName scalar-like
typedef IslandName = String;

// @contract-ir RecordString model
typedef RecordString = Map<String, String>;
// @contract-ir RecordUnknown model
typedef RecordUnknown = Map<String, Object?>;

String _requiredString(Map<String, dynamic> json, String name) {
  final value = json[name];
  if (value is! String) throw FormatException('$name must be a string');
  return value;
}

int _requiredInt(Map<String, dynamic> json, String name) {
  final value = json[name];
  if (value is! int) throw FormatException('$name must be an integer');
  return value;
}

bool _requiredBool(Map<String, dynamic> json, String name) {
  final value = json[name];
  if (value is! bool) throw FormatException('$name must be a boolean');
  return value;
}

Map<String, dynamic> _requiredObject(Object? value, String name) {
  if (value is! Map<String, dynamic>) {
    throw FormatException('$name must be an object');
  }
  return value;
}

void _expectKeys(
  Map<String, dynamic> json,
  Set<String> allowed,
  String name,
) {
  final unknown = json.keys.where((key) => !allowed.contains(key)).toList()
    ..sort();
  if (unknown.isNotEmpty) {
    throw FormatException(
        '$name contains unknown fields: ${unknown.join(', ')}');
  }
}

// @contract-ir Asset model bytes|id|kind|prepare|role|sha256|stage|url
class WasmAsset {
  final AssetId id;
  final HttpsAssetUrl url;
  final String kind;
  final String? role;
  final String? stage;
  final int bytes;
  final Sha256Hex sha256;
  final bool prepare;

  const WasmAsset({
    required this.id,
    required this.url,
    required this.kind,
    this.role,
    this.stage,
    required this.bytes,
    required this.sha256,
    required this.prepare,
  });

  AssetKind get kindValue => AssetKind.fromWire(kind);
  AssetRole? get roleValue => role == null ? null : AssetRole.fromWire(role);
  AssetStage? get stageValue =>
      stage == null ? null : AssetStage.fromWire(stage);

  factory WasmAsset.fromJson(Map<String, dynamic> json) {
    _expectKeys(
      json,
      const {
        'id',
        'url',
        'kind',
        'role',
        'stage',
        'bytes',
        'sha256',
        'prepare'
      },
      'Asset',
    );
    final kind = _requiredString(json, 'kind');
    AssetKind.fromWire(kind);
    final role = json['role'];
    if (role != null) AssetRole.fromWire(role);
    final stage = json['stage'];
    if (stage != null) AssetStage.fromWire(stage);
    return WasmAsset(
      id: _requiredString(json, 'id'),
      url: _requiredString(json, 'url'),
      kind: kind,
      role: role as String?,
      stage: stage as String?,
      bytes: _requiredInt(json, 'bytes'),
      sha256: _requiredString(json, 'sha256'),
      prepare: _requiredBool(json, 'prepare'),
    );
  }

  Map<String, Object?> toJson() => {
        'id': id,
        'url': url,
        'kind': kind,
        if (role != null) 'role': role,
        if (stage != null) 'stage': stage,
        'bytes': bytes,
        'sha256': sha256,
        'prepare': prepare,
      };
}

// @contract-ir PrepareBudget model furthestStage|maxBytes|maxConcurrency
class WasmPrepareBudget {
  final int maxBytes;
  final int maxConcurrency;
  final String furthestStage;

  const WasmPrepareBudget({
    required this.maxBytes,
    required this.maxConcurrency,
    required this.furthestStage,
  });

  PrepareStage get furthestStageValue => PrepareStage.fromWire(furthestStage);

  factory WasmPrepareBudget.fromJson(Map<String, dynamic> json) {
    _expectKeys(
      json,
      const {'maxBytes', 'maxConcurrency', 'furthestStage'},
      'PrepareBudget',
    );
    final furthestStage = _requiredString(json, 'furthestStage');
    PrepareStage.fromWire(furthestStage);
    return WasmPrepareBudget(
      maxBytes: _requiredInt(json, 'maxBytes'),
      maxConcurrency: _requiredInt(json, 'maxConcurrency'),
      furthestStage: furthestStage,
    );
  }

  Map<String, Object?> toJson() => {
        'maxBytes': maxBytes,
        'maxConcurrency': maxConcurrency,
        'furthestStage': furthestStage,
      };
}

// @contract-ir Activation model hostSelector|islands|mode|routes
class WasmActivation {
  final String mode;
  final HostSelector? hostSelector;
  final List<IslandName>? islands;
  final RecordString? routes;

  WasmActivation({
    required this.mode,
    this.hostSelector,
    List<IslandName>? islands,
    RecordString? routes,
  })  : islands = islands == null ? null : List.unmodifiable(islands),
        routes = routes == null ? null : Map.unmodifiable(routes) {
    ActivationMode.fromWire(mode);
  }

  ActivationMode get modeValue => ActivationMode.fromWire(mode);

  factory WasmActivation.fromJson(Map<String, dynamic> json) {
    _expectKeys(
      json,
      const {'mode', 'hostSelector', 'islands', 'routes'},
      'Activation',
    );
    final islands = json['islands'];
    final routes = json['routes'];
    return WasmActivation(
      mode: _requiredString(json, 'mode'),
      hostSelector: json['hostSelector'] as String?,
      islands:
          islands == null ? null : List<String>.from(islands as List<dynamic>),
      routes: routes == null
          ? null
          : Map<String, String>.from(
              _requiredObject(routes, 'routes'),
            ),
    );
  }

  Map<String, Object?> toJson() => {
        'mode': mode,
        if (hostSelector != null) 'hostSelector': hostSelector,
        if (islands != null) 'islands': islands,
        if (routes != null) 'routes': routes,
      };
}

// @contract-ir Release model activation|appId|assets|entrypoint|extensions|framework|prepareBudget|release|requiresCrossOriginIsolation|runtime|schemaVersion|toolchain
class WasmRelease {
  final int schemaVersion;
  final ApplicationId appId;
  final ReleaseId release;
  final String runtime;
  final String? framework;
  final ToolchainId? toolchain;
  final EntrypointId entrypoint;
  final bool? requiresCrossOriginIsolation;
  final List<WasmAsset> assets;
  final WasmPrepareBudget? prepareBudget;
  final WasmActivation? activation;
  final RecordUnknown extensions;

  WasmRelease({
    required this.schemaVersion,
    required this.appId,
    required this.release,
    required this.runtime,
    this.framework,
    this.toolchain,
    required this.entrypoint,
    this.requiresCrossOriginIsolation,
    required List<WasmAsset> assets,
    this.prepareBudget,
    this.activation,
    RecordUnknown extensions = const {},
  })  : assets = List.unmodifiable(assets),
        extensions = _immutableJson(extensions) as RecordUnknown {
    SchemaVersion.fromWire(schemaVersion);
    RuntimeKind.fromWire(runtime);
    if (framework != null) FrameworkKind.fromWire(framework);
  }

  SchemaVersion get schemaVersionValue => SchemaVersion.fromWire(schemaVersion);
  RuntimeKind get runtimeValue => RuntimeKind.fromWire(runtime);
  FrameworkKind? get frameworkValue =>
      framework == null ? null : FrameworkKind.fromWire(framework);

  factory WasmRelease.fromJson(Map<String, dynamic> json) {
    _expectKeys(
      json,
      const {
        'schemaVersion',
        'appId',
        'release',
        'runtime',
        'framework',
        'toolchain',
        'entrypoint',
        'requiresCrossOriginIsolation',
        'assets',
        'prepareBudget',
        'activation',
        'extensions',
      },
      'Release',
    );
    final assets = json['assets'];
    if (assets is! List<dynamic>) {
      throw const FormatException('assets must be an array');
    }
    final extensions = json['extensions'];
    return WasmRelease(
      schemaVersion: _requiredInt(json, 'schemaVersion'),
      appId: _requiredString(json, 'appId'),
      release: _requiredString(json, 'release'),
      runtime: _requiredString(json, 'runtime'),
      framework: json['framework'] as String?,
      toolchain: json['toolchain'] as String?,
      entrypoint: _requiredString(json, 'entrypoint'),
      requiresCrossOriginIsolation:
          json['requiresCrossOriginIsolation'] as bool?,
      assets: assets
          .map((value) => WasmAsset.fromJson(
                _requiredObject(value, 'assets[]'),
              ))
          .toList(),
      prepareBudget: json['prepareBudget'] == null
          ? null
          : WasmPrepareBudget.fromJson(
              _requiredObject(json['prepareBudget'], 'prepareBudget'),
            ),
      activation: json['activation'] == null
          ? null
          : WasmActivation.fromJson(
              _requiredObject(json['activation'], 'activation'),
            ),
      extensions: extensions == null
          ? const {}
          : Map<String, Object?>.from(
              _requiredObject(extensions, 'extensions'),
            ),
    );
  }

  Map<String, Object?> toJson() => {
        'schemaVersion': schemaVersion,
        'appId': appId,
        'release': release,
        'runtime': runtime,
        if (framework != null) 'framework': framework,
        if (toolchain != null) 'toolchain': toolchain,
        'entrypoint': entrypoint,
        if (requiresCrossOriginIsolation != null)
          'requiresCrossOriginIsolation': requiresCrossOriginIsolation,
        'assets': assets.map((asset) => asset.toJson()).toList(growable: false),
        if (prepareBudget != null) 'prepareBudget': prepareBudget!.toJson(),
        if (activation != null) 'activation': activation!.toJson(),
        if (extensions.isNotEmpty) 'extensions': extensions,
      };
}

Object? _immutableJson(Object? value) {
  if (value is Map) {
    return Map<String, Object?>.unmodifiable(value.map((key, child) {
      if (key is! String) {
        throw const FormatException('JSON object keys must be strings');
      }
      return MapEntry(key, _immutableJson(child));
    }));
  }
  if (value is List) {
    return List<Object?>.unmodifiable(value.map(_immutableJson));
  }
  if (value == null || value is bool || value is num || value is String) {
    return value;
  }
  throw FormatException('Unsupported JSON value: ${value.runtimeType}');
}
