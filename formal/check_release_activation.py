#!/usr/bin/env python3
"""Exhaustive small-domain v2 release/host admission model, not schema parity."""
from itertools import product

RELEASES = ("raw-wasm", "wasm-bindgen", "flutter-wasmgc")
HOSTS = ("native", "browser", "flutter")
ALLOWED = {
    "native": {"raw-wasm"},
    "browser": {"raw-wasm", "wasm-bindgen"},
    "flutter": {"flutter-wasmgc"},
}
# The precise production host matrix must be independently refined before release.
GATES = ("canonical_https", "allowlisted_origin", "digest_matches",
         "content_type_matches", "bytes_bounded", "entrypoint_valid",
         "prepare_budget_bounded", "explicit_user_activation")


def model_activate(host, release, gates):
    return release in ALLOWED[host] and all(gates)


def check(mutant_ignore_start=False):
    inspected = 0
    permitted = 0
    for host, release in product(HOSTS, RELEASES):
        for gates in product((False, True), repeat=len(GATES)):
            inspected += 1
            decision = (release in ALLOWED[host] and
                        all(gates[:-1]) and (gates[-1] or mutant_ignore_start))
            if decision:
                permitted += 1
                assert release in ALLOWED[host], ("incompatible runtime", host, release)
                assert all(gates), ("unsafe activation", host, release, gates)
            if not all(gates) or release not in ALLOWED[host]:
                assert not model_activate(host, release, gates)
            else:
                assert model_activate(host, release, gates)
    return inspected, permitted


def main():
    combinations, accepted = check()
    assert combinations == len(HOSTS) * len(RELEASES) * 2 ** len(GATES)
    assert accepted > 0
    try:
        check(mutant_ignore_start=True)
    except AssertionError as error:
        assert "unsafe activation" in str(error), error
    else:
        raise AssertionError("activation-without-consent mutation escaped")
    print(f"BOUNDED_RELEASE_MODEL_PASS combinations={combinations} accepted={accepted}")
    print("SCHEMA_AND_HOST_REFINEMENT=NOT_EXECUTED")
    print("ATTOLANG_GUEST_EXECUTION=NOT_EXECUTED")


if __name__ == "__main__":
    main()
