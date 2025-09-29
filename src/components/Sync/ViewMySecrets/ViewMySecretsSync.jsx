import React, { useMemo } from "react";
import ViewMySecrets from "../../ViewMySecrets/ViewMySecrets.jsx";
import { computeSecretsState } from "./ViewMySecretsLogic.js";

export default function ViewMySecretsSync({
  allSecrets = [],
  playerId,
  anchorClass = "",
}) {
  // Derive mapped secrets only when inputs change
  const secrets = useMemo(
    () => computeSecretsState(allSecrets, playerId),
    [allSecrets, playerId]
  );

  return (
    <div className={anchorClass}>
      <ViewMySecrets secrets={secrets} />
    </div>
  );
}
