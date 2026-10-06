import { MODULE_ID, MODULE_TITLE, MODULE_VERSION, SETTINGS } from "./constants.js";
import { FogPolicyDashboard, registerDashboardMenu } from "./dashboard.js";
import { logger } from "./logger.js";
import {
  enforcePendingSceneCreate,
  enforcePendingSceneUpdate,
  getAudit,
  isSceneExempt,
  purgeStoredExploration,
  repairExistingScenes,
  repairSceneIfNeeded,
  setSceneExempt
} from "./policy.js";
import { readPolicySettings, registerSettings } from "./settings.js";

function exposePublicApi() {
  const module = game.modules.get(MODULE_ID);
  if (!module) return;

  module.api = Object.freeze({
    version: MODULE_VERSION,
    audit: getAudit,
    repair: repairExistingScenes,
    purgeStoredExploration,
    setSceneExempt,
    isSceneExempt,
    openDashboard() {
      if (!game.user?.isGM) {
        throw new Error(`${MODULE_TITLE}: only a GM may open the policy dashboard.`);
      }
      return new FogPolicyDashboard().render({ force: true });
    }
  });
}

Hooks.once("init", () => {
  registerSettings();
  registerDashboardMenu();
  exposePublicApi();
  logger.info(`Initialized v${MODULE_VERSION}.`);
});

Hooks.on("preCreateScene", (scene) => {
  try {
    enforcePendingSceneCreate(scene);
  } catch (error) {
    logger.error("Failed to enforce Fog Exploration policy before Scene creation.", error);
  }
});

Hooks.on("preUpdateScene", (scene, changes) => {
  try {
    enforcePendingSceneUpdate(scene, changes);
  } catch (error) {
    logger.error("Failed to enforce Fog Exploration policy before Scene update.", error);
  }
});

Hooks.on("createScene", (scene) => {
  void repairSceneIfNeeded(scene).catch((error) => {
    logger.error("Failed to repair a newly created Scene.", error);
  });
});

Hooks.on("updateScene", (scene) => {
  void repairSceneIfNeeded(scene).catch((error) => {
    logger.error("Failed to repair an updated Scene.", error);
  });
});

Hooks.once("ready", () => {
  const settings = readPolicySettings();
  if (!settings.enabled || !settings.repairOnReady || !game.user?.isActiveGM) return;

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
    })
    .catch((error) => {
      logger.error("Automatic Scene repair failed.", error);
      ui.notifications.error(
        game.i18n.localize("RUNYTH_FOG_POLICY.Notifications.AutomaticRepairFailed")
      );
    });
});
