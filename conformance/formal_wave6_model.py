#!/usr/bin/env python3
from itertools import combinations
APPROVED={"http","clock","log"}
ALL=("http","clock","log","fs","spawn")
for n in range(len(ALL)+1):
  for requested in map(set,combinations(ALL,n)):
    admitted=requested<=APPROVED
    if admitted: assert not ({"fs","spawn"}&requested)
    if "fs" in requested or "spawn" in requested: assert not admitted
print("WASM import capability subset: ok")
