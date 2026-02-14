import { debug } from '@ember/debug';

/**
 * Register dashboard and widgets for Steelbunch TMS Console
 * Runs after extensions are loaded
 */
export function initialize(appInstance) {
    const widgetService = appInstance.lookup('service:universe/widget-service');

    debug('[Initializing Widgets] Registering console dashboard...');

    // Register the console dashboard
    widgetService.registerDashboard('dashboard');

    // Widgets removed during Steelbunch rebranding
    const widgets = [];

    // Register widgets
    widgetService.registerWidgets('dashboard', widgets);
}

export default {
    name: 'initialize-widgets',
    after: 'load-extensions',
    initialize,
};
