import owls_config

fn expect_string(label: String, actual: String, expected: String) -> Nil {
  case actual == expected {
    True -> Nil
    False -> panic as label
  }
}

fn expect_int(label: String, actual: Int, expected: Int) -> Nil {
  case actual == expected {
    True -> Nil
    False -> panic as label
  }
}

pub fn main() {
  expect_int(
    "ConfigVersion.ConfigV1",
    owls_config.config_version_to_int(owls_config.ConfigV1),
    1,
  )

  expect_string(
    "HostKind.Browser",
    owls_config.host_kind_to_wire(owls_config.Browser),
    "browser",
  )
  expect_string(
    "HostKind.Ssr",
    owls_config.host_kind_to_wire(owls_config.Ssr),
    "ssr",
  )
  expect_string(
    "HostKind.Worker",
    owls_config.host_kind_to_wire(owls_config.Worker),
    "worker",
  )
  expect_string(
    "HostKind.RustNative",
    owls_config.host_kind_to_wire(owls_config.RustNative),
    "rust-native",
  )
  expect_string(
    "HostKind.Flutter",
    owls_config.host_kind_to_wire(owls_config.Flutter),
    "flutter",
  )

  expect_string(
    "PrepareTrigger.Explicit",
    owls_config.prepare_trigger_to_wire(owls_config.Explicit),
    "explicit",
  )
  expect_string(
    "PrepareTrigger.Intent",
    owls_config.prepare_trigger_to_wire(owls_config.Intent),
    "intent",
  )
  expect_string(
    "PrepareTrigger.Idle",
    owls_config.prepare_trigger_to_wire(owls_config.Idle),
    "idle",
  )
  expect_string(
    "PrepareTrigger.Disabled",
    owls_config.prepare_trigger_to_wire(owls_config.Disabled),
    "disabled",
  )

  expect_string(
    "ConfigPrepareStage.Fetch",
    owls_config.config_prepare_stage_to_wire(owls_config.Fetch),
    "fetch",
  )
  expect_string(
    "ConfigPrepareStage.Compile",
    owls_config.config_prepare_stage_to_wire(owls_config.Compile),
    "compile",
  )

  expect_string(
    "ActivationPolicy.Explicit",
    owls_config.activation_policy_to_wire(owls_config.ActivationExplicit),
    "explicit",
  )
  expect_string(
    "ActivationPolicy.Route",
    owls_config.activation_policy_to_wire(owls_config.Route),
    "route",
  )
  expect_string(
    "ActivationPolicy.Startup",
    owls_config.activation_policy_to_wire(owls_config.Startup),
    "startup",
  )
  expect_string(
    "ActivationPolicy.Disabled",
    owls_config.activation_policy_to_wire(owls_config.ActivationDisabled),
    "disabled",
  )

  expect_string(
    "EnvValueType.String",
    owls_config.env_value_type_to_wire(owls_config.EnvString),
    "string",
  )
  expect_string(
    "EnvValueType.Integer",
    owls_config.env_value_type_to_wire(owls_config.EnvInteger),
    "integer",
  )
  expect_string(
    "EnvValueType.Bool",
    owls_config.env_value_type_to_wire(owls_config.EnvBool),
    "bool",
  )
  expect_string(
    "EnvValueType.Double",
    owls_config.env_value_type_to_wire(owls_config.EnvDouble),
    "double",
  )
  expect_string(
    "EnvValueType.Json",
    owls_config.env_value_type_to_wire(owls_config.EnvJson),
    "json",
  )
  expect_string(
    "EnvValueType.Array",
    owls_config.env_value_type_to_wire(owls_config.EnvArray),
    "array",
  )
  expect_string(
    "EnvValueType.Map",
    owls_config.env_value_type_to_wire(owls_config.EnvMap),
    "map",
  )
}
