import { MODULE_ID, MODULE_VERSION, SETTINGS } from "./constants.js";
import { FogPolicyDashboard, registerDashboardMenu } from "./dashboard.js";
import { reportError, requireGm } from "./errors.js";
import { logger } from "./logger.js";
import {
  enforcePendingSceneCreate,
  enforcePendingSceneUpdate,
  getAudit,
  isActiveGmClient,
  isSceneExempt,
  purgeStoredExploration,
  repairExistingScenes,
  repairSceneIfNeeded,
  restoreSceneStates,
  setSceneExempt,
  setScenesExempt
} from "./policy.js";
import { readPolicySettings, registerSettings } from "./settings.js";

function exposePublicApi() {
  const module = game.modules.get(MODULE_ID);
  if (!module) {
    logger.warn("Could not expose public API because the module record is unavailable.");
    return;
  }

  module.api = Object.freeze({
    version: MODULE_VERSION,
    audit: getAudit,
    repair: repairExistingScenes,
    purgeStoredExploration,
    setSceneExempt,
    setScenesExempt,
    restoreSceneStates,
    isSceneExempt,
    openDashboard() {
      requireGm("Opening the Fog Policy dashboard");
      return new FogPolicyDashboard().render({ force: true });
    }
  });
}

Hooks.once("init", () => {
  try {
    registerSettings();
    registerDashboardMenu();
    exposePublicApi();
    logger.info(`Initialized v${MODULE_VERSION}.`);
  } catch (error) {
    reportError(error, { context: "Initialization", notify: game.user?.isGM === true });
  }
});

Hooks.on("preCreateScene", (scene) => {
  try {
    enforcePendingSceneCreate(scene);
  } catch (error) {
    reportError(error, {
      context: "Pre-create Fog Policy enforcement",
      notify: game.user?.isGM === true
    });
  }
});

Hooks.on("preUpdateScene", (scene, changes, options) => {
  if (options?.runythFogPolicy) return;
  try {
    enforcePendingSceneUpdate(scene, changes);
  } catch (error) {
    reportError(error, {
      context: "Pre-update Fog Policy enforcement",
      notify: game.user?.isGM === true
    });
  }
});

Hooks.on("createScene", (scene, _options, _userId) => {
  void repairSceneIfNeeded(scene).catch((error) => {
    reportError(error, {
      context: `Repair newly created Scene ${scene?.name ?? ""}`.trim(),
      notify: isActiveGmClient()
    });
  });
});

Hooks.on("updateScene", (scene, _changes, options) => {
  if (options?.runythFogPolicy) return;
  void repairSceneIfNeeded(scene).catch((error) => {
    reportError(error, {
      context: `Repair updated Scene ${scene?.name ?? ""}`.trim(),
      notify: isActiveGmClient()
    });
  });
});

Hooks.once("ready", () => {
  try {
    const settings = readPolicySettings();
    if (!settings.enabled || !settings.repairOnReady || !isActiveGmClient()) return;

    void repairExistingScenes({ notify: false })
      .then((result) => {
        if (
          result.updated > 0 &&
          game.settings.get(MODULE_ID, SETTINGS.NOTIFY_AUTOMATIC_REPAIR)
        ) {
          ui.notifications.info(
            game.i18n.format("RUNYTH_FOG_POLICY.Notifications.AutomaticRepair", {
              count: result.updated
            })
          );
        }
        if (result.failed > 0) {
          ui.notifications.error(
            game.i18n.format("RUNYTH_FOG_POLICY.Notifications.PartialFailure", {
              operation: game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.RepairAll"),
              count: result.failed
            }),
            { permanent: true }
          );
        }
      })
      .catch((error) => {
        reportError(error, { context: "Automatic Scene repair", notify: true });
      });
  } catch (error) {
    reportError(error, { context: "Ready-time policy startup", notify: game.user?.isGM === true });
  }
});
