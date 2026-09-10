import type {
  ActivationPolicy,
  ConfigActivation,
  ConfigPrepare,
  ConfigPrepareStage,
  ConfigVersion,
  EnvDeclaration,
  EnvValueType,
  HostConfig,
  HostKind,
  OresWasmConfig,
  PrepareTrigger,
} from './config.js';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? (<Value>() => Value extends Right ? 1 : 2) extends
        (<Value>() => Value extends Left ? 1 : 2)
      ? true
      : false
    : false;

type Assert<Condition extends true> = Condition;

type RequiredKeys<Value> = {
  [Key in keyof Value]-?: Record<never, never> extends Pick<Value, Key>
    ? never
    : Key;
}[keyof Value];

type _ConfigVersion = Assert<Equal<ConfigVersion, 1>>;
type _HostKind = Assert<
  Equal<HostKind, 'browser' | 'flutter' | 'rust-native' | 'ssr' | 'worker'>
>;
type _PrepareTrigger = Assert<
  Equal<PrepareTrigger, 'disabled' | 'explicit' | 'idle' | 'intent'>
>;
type _ConfigPrepareStage = Assert<Equal<ConfigPrepareStage, 'compile' | 'fetch'>>;
type _ActivationPolicy = Assert<
  Equal<ActivationPolicy, 'disabled' | 'explicit' | 'route' | 'startup'>
>;
type _EnvValueType = Assert<
  Equal<EnvValueType, 'array' | 'bool' | 'double' | 'integer' | 'json' | 'map' | 'string'>
>;

type _ConfigPrepareKeys = Assert<
  Equal<keyof ConfigPrepare, 'furthestStage' | 'maxBytes' | 'maxConcurrency' | 'trigger'>
>;
type _ConfigPrepareRequired = Assert<Equal<RequiredKeys<ConfigPrepare>, 'trigger'>>;

type _ConfigActivationKeys = Assert<Equal<keyof ConfigActivation, 'policy'>>;
type _ConfigActivationRequired = Assert<Equal<RequiredKeys<ConfigActivation>, 'policy'>>;

type _HostConfigKeys = Assert<
  Equal<
    keyof HostConfig,
    'activation' | 'allowedOrigins' | 'enabled' | 'kind' | 'prepare' | 'releaseManifest' | 'root'
  >
>;
type _HostConfigRequired = Assert<Equal<RequiredKeys<HostConfig>, 'kind' | 'releaseManifest'>>;

type _EnvDeclarationKeys = Assert<Equal<keyof EnvDeclaration, 'env' | 'required' | 'target' | 'type'>>;
type _EnvDeclarationRequired = Assert<Equal<RequiredKeys<EnvDeclaration>, 'env' | 'target' | 'type'>>;

type _OresWasmConfigKeys = Assert<
  Equal<keyof OresWasmConfig, 'enabled' | 'env' | 'extensions' | 'hosts' | 'strict' | 'version'>
>;
type _OresWasmConfigRequired = Assert<
  Equal<RequiredKeys<OresWasmConfig>, 'enabled' | 'hosts' | 'version'>
>;

export {};
