import { MODULE_ID } from "./constants.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class FogPolicyDashboardHelp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-dashboard-help`,
    classes: [MODULE_ID, "runyth-fog-policy-help"],
    position: {
      width: 720,
      height: 700
    },
    window: {
      title: "RUNYTH_FOG_POLICY.Help.Title",
      icon: "fa-solid fa-circle-question",
      resizable: true
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/help.hbs`
    }
  };
}

let helpWindow = null;

export async function openDashboardHelp() {
  if (helpWindow?.rendered) {
    helpWindow.bringToFront();
    return helpWindow;
  }

  helpWindow = new FogPolicyDashboardHelp();
  await helpWindow.render({ force: true });
  return helpWindow;
}
