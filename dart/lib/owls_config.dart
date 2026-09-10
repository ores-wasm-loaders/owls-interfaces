/// Downstream `.ores-wasm.toml` semantic projection only.
/// TypeSpec and authored JSON Schema remain independent peer authorities.

// @config-contract-ir ConfigVersion enum 1
enum ConfigVersion {
  v1(1);

  const ConfigVersion(this.wire);
  final int wire;
}

// @config-contract-ir HostKind enum browser|flutter|rust-native|ssr|worker
enum HostKind {
  browser('browser'),
  ssr('ssr'),
  worker('worker'),
  rustNative('rust-native'),
  flutter('flutter');

  const HostKind(this.wire);
  final String wire;
}

// @config-contract-ir PrepareTrigger enum disabled|explicit|idle|intent
enum PrepareTrigger {
  explicit('explicit'),
  intent('intent'),
  idle('idle'),
  disabled('disabled');

  const PrepareTrigger(this.wire);
  final String wire;
}

// @config-contract-ir ConfigPrepareStage enum compile|fetch
enum ConfigPrepareStage {
  fetch('fetch'),
  compile('compile');

  const ConfigPrepareStage(this.wire);
  final String wire;
}

// @config-contract-ir ActivationPolicy enum disabled|explicit|route|startup
enum ActivationPolicy {
  explicit('explicit'),
  route('route'),
  startup('startup'),
  disabled('disabled');

  const ActivationPolicy(this.wire);
  final String wire;
}

// @config-contract-ir EnvValueType enum array|bool|double|integer|json|map|string
enum EnvValueType {
  string('string'),
  integer('integer'),
  bool('bool'),
  doubleValue('double'),
  json('json'),
  array('array'),
  map('map');

  const EnvValueType(this.wire);
  final String wire;
}

// @config-contract-ir RepoPath scalar-like
typedef RepoPath = String;
// @config-contract-ir EnvKey scalar-like
typedef EnvKey = String;
// @config-contract-ir ConfigTarget scalar-like
typedef ConfigTarget = String;

// @config-contract-ir ConfigPrepare model furthestStage|maxBytes|maxConcurrency|trigger
class ConfigPrepare {
  final PrepareTrigger trigger;
  final int? maxBytes;
  final int? maxConcurrency;
  final ConfigPrepareStage? furthestStage;

  const ConfigPrepare({
    required this.trigger,
    this.maxBytes,
    this.maxConcurrency,
    this.furthestStage,
  });
}

// @config-contract-ir ConfigActivation model policy
class ConfigActivation {
  final ActivationPolicy policy;

  const ConfigActivation({required this.policy});
}

// @config-contract-ir HostConfig model activation|allowedOrigins|enabled|kind|prepare|releaseManifest|root
class HostConfig {
  final HostKind kind;
  final bool? enabled;
  final RepoPath? root;
  final RepoPath releaseManifest;
  final List<String>? allowedOrigins;
  final ConfigPrepare? prepare;
  final ConfigActivation? activation;

  HostConfig({
    required this.kind,
    this.enabled,
    this.root,
    required this.releaseManifest,
    List<String>? allowedOrigins,
    this.prepare,
    this.activation,
  }) : allowedOrigins = allowedOrigins == null
            ? null
            : List<String>.unmodifiable(allowedOrigins);
}

// @config-contract-ir HostConfigMap model
typedef HostConfigMap = Map<String, HostConfig>;

// @config-contract-ir EnvDeclaration model env|required|target|type
class EnvDeclaration {
  final EnvKey env;
  final EnvValueType type;
  final ConfigTarget target;
  final bool? required;

  const EnvDeclaration({
    required this.env,
    required this.type,
    required this.target,
    this.required,
  });
}

// @config-contract-ir EnvDeclarationMap model
typedef EnvDeclarationMap = Map<String, EnvDeclaration>;

// @config-contract-ir ConfigExtensions model
typedef ConfigExtensions = Map<String, Object?>;

// @config-contract-ir OresWasmConfig model enabled|env|extensions|hosts|strict|version
class OresWasmConfig {
  final ConfigVersion version;
  final bool enabled;
  final bool? strict;
  final HostConfigMap hosts;
  final EnvDeclarationMap? env;
  final ConfigExtensions? extensions;

  OresWasmConfig({
    required this.version,
    required this.enabled,
    this.strict,
    required HostConfigMap hosts,
    EnvDeclarationMap? env,
    ConfigExtensions? extensions,
  })  : hosts = Map<String, HostConfig>.unmodifiable(hosts),
        env = env == null ? null : Map<String, EnvDeclaration>.unmodifiable(env),
        extensions = extensions == null
            ? null
            : Map<String, Object?>.unmodifiable(extensions);
}
