import React, { useMemo } from "react";
import ViewMySecrets from "../../ViewMySecrets/ViewMySecrets.jsx";
import { computeSecretsState } from "./ViewMySecretsLogic.js";

export default function ViewMySecretsSync({ allSecrets = [], playerId }) {
  // Derive mapped secrets only when inputs change
  const secrets = useMemo(
    () => computeSecretsState(allSecrets, playerId),
    [allSecrets, playerId]
  );

  return (
    <div className="absolute inset-0">
      <ViewMySecrets secrets={secrets} />
    </div>
  );
}
